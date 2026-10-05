import { createFileRoute } from '@tanstack/react-router';
import { SHIFTS, pad, type ShiftNum } from '@/lib/production';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/** Current wall-clock parts in the plant timezone (Asia/Kolkata), matching the app's business-day rule. */
function plantNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24 };
}

/** Business day starts at 06:00; before 06:00 belongs to the previous business date. */
function resolveSlot(now = new Date()) {
  const { year, month, day, hour } = plantNow(now);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (hour < 6) d.setUTCDate(d.getUTCDate() - 1);
  const entry_date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  let shift: ShiftNum;
  let slot_index: number;
  if (hour >= 6 && hour < 14) {
    shift = 1;
    slot_index = hour - 6;
  } else if (hour >= 14 && hour < 22) {
    shift = 2;
    slot_index = hour - 14;
  } else {
    shift = 3;
    slot_index = hour >= 22 ? hour - 22 : hour + 2;
  }

  const time_slot = SHIFTS[shift].slots[slot_index] ?? '';
  return { entry_date, shift, slot_index, time_slot };
}

export const Route = createFileRoute('/api/public/record-production')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        try {
          // Hosts without the privileged key (e.g. Vercel) relay the untouched request to the
          // Lovable-hosted endpoint, which validates the device key and records the load.
          if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) {
            const origin = (process.env['PPMS_RELAY_ORIGIN'] || 'https://phorotech2-production-monitor-system.lovable.app').replace(/\/$/, '');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const dk = request.headers.get('x-device-key');
            if (dk) headers['x-device-key'] = dk;
            const upstream = await fetch(`${origin}/api/public/record-production`, { method: 'POST', headers, body: await request.text() });
            return new Response(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
          }

          const expectedKey = process.env['IOT_DEVICE_KEY'];
          if (!expectedKey) {
            console.error('[record-production] IOT_DEVICE_KEY is not configured');
            return json({ success: false, error: 'Server not configured' }, 500);
          }

          let deviceKey: unknown;
          try {
            const body = (await request.json()) as { device_key?: unknown };
            deviceKey = body?.device_key;
          } catch {
            return json({ success: false, error: 'Invalid JSON body' }, 400);
          }

          const headerKey = request.headers.get('x-device-key');
          const provided = typeof deviceKey === 'string' && deviceKey ? deviceKey : headerKey;

          if (!provided || provided.length !== expectedKey.length || provided !== expectedKey) {
            console.warn('[record-production] rejected request: invalid device key');
            return json({ success: false, error: 'Unauthorized' }, 401);
          }

          const { entry_date, shift, slot_index, time_slot } = resolveSlot();

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

          // Global production mode gate (also enforced inside the RPC / DB trigger).
          const { data: mode, error: modeError } = await supabaseAdmin.rpc('production_mode');
          if (modeError) {
            console.error('[record-production] mode lookup failed', modeError.message);
            return json({ success: false, error: 'Failed to record load' }, 500);
          }
          if (mode !== 'AUTO') {
            return json({ success: false, error: 'Production system is in MANUAL mode' }, 403);
          }

          const { data, error } = await supabaseAdmin.rpc('increment_production_load', {
            _entry_date: entry_date,
            _shift: shift,
            _time_slot: time_slot,
            _slot_index: slot_index,
          });

          if (error) {
            console.error('[record-production] rpc failed', error.message);
            return json({ success: false, error: 'Failed to record load' }, 500);
          }

          const row = (Array.isArray(data) ? data[0] : data) as
            | { load_count?: number }
            | null;

          console.log(
            `[record-production] +1 load ${entry_date} shift ${shift} slot ${slot_index} -> ${row?.load_count}`,
          );

          return json({
            success: true,
            entry_date,
            shift,
            time_slot,
            slot_index,
            load_count: row?.load_count ?? null,
          });
        } catch (err) {
          console.error('[record-production] unexpected error', err);
          return json({ success: false, error: 'Internal error' }, 500);
        }
      },
    },
  },
});

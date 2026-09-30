<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep production and downtime authorization in database RLS/helpers; UI permission checks only control visibility because direct requests must remain protected.
- Preserve maintenance attendance snapshots even when a team member is deactivated, because historical reports must retain the original identity and designation.
- Keep the Android-ready dashboard as a responsive mobile presentation over the existing data hooks; desktop and TV routes remain independent and unchanged.

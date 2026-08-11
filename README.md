# phorotech2-production-monitor-system

Build a modern Industrial Production Monitoring Dashboard web application.

Project Name:

PHOROTECH SURFIN INDIA PVT LTD

PLANT - II

ED PLANT

IRUNGATTUKOTTAI

Theme:

Luxury Golden + Black + White

Industrial Premium Dashboard

Responsive for Mobile, Tablet and Desktop.

====================================================

PROJECT OVERVIEW

This application is used to manually count Production Loads.

Factory has 3 Rotational Shifts.

Shift I

06:00 AM - 02:00 PM

Shift II

02:00 PM - 10:00 PM

Shift III

10:00 PM - 06:00 AM

Average Production

1 Load = Every 6 Minutes

Approx 10 Loads Per Hour

There is NO automatic counter.

Production Supervisor manually enters load count through Admin/Auth Page.

Dashboard displays Live Data.

====================================================

TECH STACK

React

Next.js

TypeScript

Tailwind CSS

Shadcn UI

Supabase

Use clean architecture.

====================================================

LOGIN

Admin Authentication

Username

Password

Forgot Password

Logout

====================================================

DASHBOARD HEADER

Large Company Name

PHOROTECH SURFIN INDIA PVT LTD

PLANT II

ED PLANT

IRUNGATTUKOTTAI

Current Date

Current Time

Current Shift

Current Month

Today's Date

====================================================

MAIN CARD

A very large Golden Glass Card.

Title

TOTAL NO OF LOADS

Display total monthly production.

Font Size

Very Large

Golden Animated Number

Example

3560

This number should update instantly after admin saves new entry.

====================================================

SHIFT CARDS

Display 3 Cards

Shift I

06 AM - 02 PM

Hourly Slots

06-07

07-08

08-09

09-10

10-11

11-12

12-01

01-02

Each row

Time

Load Count

Total at Bottom

---------------------------------

Shift II

02 PM - 10 PM

02-03

03-04

04-05

05-06

06-07

07-08

08-09

09-10

Total

---------------------------------

Shift III

10 PM - 06 AM

10-11

11-12

12-01

01-02

02-03

03-04

04-05

05-06

Total

====================================================

SHIFT RESET RULE

Every Day

06:00 AM

All Shift Hourly Data resets automatically.

Monthly Total should NOT reset.

====================================================

MONTHLY RESET

Every Month

1st Date

06:00 AM

Automatically

Reset

Monthly Total

Highest Production Record

Monthly Report Data

Start Fresh Month.

====================================================

FOOTER

Display

Highest Production Day of Current Month

Example

Highest Production

15 July 2026

Shift II

126 Loads

Display inside Premium Golden Card.

====================================================

ADMIN PANEL

CRUD System

Create Entry

Edit Entry

Delete Entry

View History

====================================================

ENTRY FORM

Select Date

Select Shift

Select Time Slot

Enter Load Count

Remarks (Optional)

Save

Update

Delete

====================================================

VALIDATION

Only one entry allowed for each

Date

Shift

Time Slot

If already exists

Allow Edit

Do not create duplicate.

====================================================

REAL TIME UPDATE

Whenever admin saves

Dashboard updates immediately.

No page refresh.

====================================================

REPORT

Dashboard Bottom

Button

Download Monthly Report

Generate PDF

Include

Company Name

Month

Total Monthly Loads

Shift Wise Total

Hourly Data

Highest Production Date

Highest Production Shift

Generated Date

Professional Industrial Report

Landscape A4

====================================================

DASHBOARD DESIGN

Premium Manufacturing Dashboard

Black Background

Golden Accent

Glass Morphism

Rounded Cards

Soft Shadows

Smooth Animation

Large Numbers

Beautiful Icons

Modern Tables

Hover Effects

Responsive Layout

====================================================

MOBILE VIEW

Cards stacked

Large Total Number

Scrollable Shift Tables

Sticky Header

Responsive Buttons

====================================================

TABLET VIEW

2 Column Layout

====================================================

DESKTOP VIEW

3 Shift Cards in Single Row

Large Center Total Card

Professional Factory Dashboard

====================================================

COLOR PALETTE

Background

#0B0B0B

Golden

#D4AF37

White

#FFFFFF

Light Gold

#FFD700

Gray

#2E2E2E

====================================================

ANIMATIONS

Counter Animation

Fade In

Glass Hover

Smooth Loading

Button Ripple

====================================================

ICONS

Factory

Calendar

Clock

Chart

Download

Edit

Delete

Save

Shield

====================================================

DATABASE STRUCTURE

Table

production_entries

id

date

month

year

shift

time_slot

load_count

remarks

created_at

updated_at

====================================================

CALCULATIONS

Monthly Total =

Sum(All Loads)

Shift Total =

Sum(Hourly Loads)

Highest Production Day =

Maximum Daily Total

Current Shift =

Automatically detect using current time.

====================================================

BONUS FEATURES

Dark Mode (Default)

Search by Date

Filter by Shift

Print Report

Export Excel

Dashboard Refresh Button

Production Trend Chart

Monthly Progress Bar

Last Updated Time

Online/Offline Indicator

Backup Database

Toast Notifications

Loading Skeleton

Confirmation Dialog

Error Handling

Responsive Typography

Professional Industrial UI

====================================================

UI Inspiration

Premium Factory Dashboard

SCADA Style

Industrial Production Monitoring

Luxury Black & Gold Theme

Minimal Professional Interface

====================================================

REAL TIME AUTO CALCULATION

Whenever Admin enters or edits Hourly Load Count and clicks SAVE,

the Dashboard should update instantly without page refresh.

The following values must update automatically:

✓ Monthly Total Number of Loads

✓ Shift Total

✓ Daily Total

✓ Hourly Total

✓ Highest Production Date

✓ Highest Production Shift

✓ Highest Production Load Count

✓ Production Trend Chart

✓ Last Updated Time

Example

Admin Entry

Date : 13-07-2026

Shift : I Shift

Time Slot : 07 AM - 08 AM

Load Count : 8

After clicking SAVE,

Dashboard immediately updates

Monthly Total

1256 → 1264

Shift Total

42 → 50

Daily Total

75 → 83

Highest Production Record should automatically recalculate if required.

No Refresh.

No Manual Calculation.

Everything should happen automatically in real-time.

====================================================

CALCULATION LOGIC

Monthly Total =

SUM(All Load Count values of current month)

Daily Total =

SUM(All Load Count values of selected date)

Shift Total =

SUM(All hourly load counts of selected shift)

Highest Production Day =

Date with Maximum Daily Total

Highest Production Shift =

Shift with Maximum Shift Total on that Highest Production Day

Whenever an existing entry is EDITED or DELETED,

all totals must automatically recalculate.

Never store calculated totals separately.

Always calculate from production_entries table to avoid incorrect totals.

====================================================

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://phorotech2-production-monitor-system.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5bbd8cd8-e476-44a3-ad67-ef75a6d3c0d4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

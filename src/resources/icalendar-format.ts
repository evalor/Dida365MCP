/**
 * Resource: iCalendar Format Reference
 * Provides reference documentation for iCalendar (RFC 5545) TRIGGER and RRULE formats
 * Helps LLMs understand how to correctly fill in reminders and repeatFlag parameters
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ResourceRegistrationFunction } from "./terminology.js";

/**
 * iCalendar format reference content
 * This resource provides format documentation for TRIGGER (reminders) and RRULE (repeat rules)
 * used in Dida365/TickTick task management.
 */
const ICALENDAR_FORMAT_REFERENCE = `# iCalendar Format Reference (iCalendar 格式参考)

This reference provides documentation for iCalendar (RFC 5545) formats used in Dida365/TickTick for reminders and repeat rules.

## TRIGGER Format (提醒格式) - For \`reminders\` Parameter

The \`reminders\` parameter uses iCalendar TRIGGER format to specify when reminders should fire relative to the task's due time.

### Common TRIGGER Examples

| User Request | TRIGGER Value | Description |
|--------------|---------------|-------------|
| 准时提醒 / At due time | \`TRIGGER:PT0S\` | At the exact due time (准时) |
| 提前5分钟 / 5 minutes before | \`TRIGGER:-PT5M\` | 5 minutes before due time |
| 提前10分钟 / 10 minutes before | \`TRIGGER:-PT10M\` | 10 minutes before due time |
| 提前15分钟 / 15 minutes before | \`TRIGGER:-PT15M\` | 15 minutes before due time |
| 提前30分钟 / 30 minutes before | \`TRIGGER:-PT30M\` | 30 minutes before due time |
| 提前45分钟 / 45 minutes before | \`TRIGGER:-PT45M\` | 45 minutes before due time |
| 提前1小时 / 1 hour before | \`TRIGGER:-PT1H\` | 1 hour before due time |
| 提前2小时 / 2 hours before | \`TRIGGER:-PT2H\` | 2 hours before due time |
| 提前3小时 / 3 hours before | \`TRIGGER:-PT3H\` | 3 hours before due time |
| 提前1天 / 1 day before | \`TRIGGER:-P1D\` | 1 day before due time |
| 提前2天 / 2 days before | \`TRIGGER:-P2D\` | 2 days before due time |
| 提前1周 / 1 week before | \`TRIGGER:-P1W\` | 1 week before due time |

### TRIGGER Format Pattern

\`\`\`
TRIGGER:[sign]P[duration]
\`\`\`

**Components:**
- \`TRIGGER:\` - Required prefix
- \`-\` (minus sign) - Indicates BEFORE the due time (most common)
- No sign or \`+\` - Indicates AFTER the due time (rare)
- \`P\` - Period designator (required)
- \`T\` - Time designator (required for hours, minutes, seconds)

**Duration Units:**
- \`W\` - Weeks (e.g., \`P1W\` = 1 week)
- \`D\` - Days (e.g., \`P1D\` = 1 day)
- \`H\` - Hours (e.g., \`PT1H\` = 1 hour, requires \`T\` prefix)
- \`M\` - Minutes (e.g., \`PT30M\` = 30 minutes, requires \`T\` prefix)
- \`S\` - Seconds (e.g., \`PT0S\` = 0 seconds, requires \`T\` prefix)

**Examples with Explanation:**
- \`TRIGGER:PT0S\` = P(eriod) T(ime) 0 S(econds) = At due time
- \`TRIGGER:-PT30M\` = Minus P(eriod) T(ime) 30 M(inutes) = 30 minutes before
- \`TRIGGER:-PT1H30M\` = Minus P(eriod) T(ime) 1 H(our) 30 M(inutes) = 1.5 hours before
- \`TRIGGER:-P1D\` = Minus P(eriod) 1 D(ay) = 1 day before
- \`TRIGGER:-P1DT9H\` = Minus P(eriod) 1 D(ay) T(ime) 9 H(ours) = 1 day and 9 hours before

### Multiple Reminders

The \`reminders\` parameter accepts an array of TRIGGER values. For example, to set reminders at due time and 30 minutes before:

\`\`\`json
["TRIGGER:PT0S", "TRIGGER:-PT30M"]
\`\`\`

---

## RRULE Format (重复规则格式) - For \`repeatFlag\` Parameter

The \`repeatFlag\` parameter uses iCalendar RRULE format to specify task recurrence patterns.

### Common RRULE Examples

| User Request | RRULE Value |
|--------------|-------------|
| 每天重复 / Daily | \`RRULE:FREQ=DAILY;INTERVAL=1\` |
| 每2天重复 / Every 2 days | \`RRULE:FREQ=DAILY;INTERVAL=2\` |
| 每3天重复 / Every 3 days | \`RRULE:FREQ=DAILY;INTERVAL=3\` |
| 每周重复 / Weekly | \`RRULE:FREQ=WEEKLY;INTERVAL=1\` |
| 每两周重复 / Every 2 weeks | \`RRULE:FREQ=WEEKLY;INTERVAL=2\` |
| 每月重复 / Monthly | \`RRULE:FREQ=MONTHLY;INTERVAL=1\` |
| 每两个月重复 / Every 2 months | \`RRULE:FREQ=MONTHLY;INTERVAL=2\` |
| 每年重复 / Yearly | \`RRULE:FREQ=YEARLY;INTERVAL=1\` |

### Day-of-Week Patterns (按星期重复)

| User Request | RRULE Value |
|--------------|-------------|
| 工作日重复 / Weekdays | \`RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\` |
| 周末重复 / Weekends | \`RRULE:FREQ=WEEKLY;BYDAY=SA,SU\` |
| 每周一 / Every Monday | \`RRULE:FREQ=WEEKLY;BYDAY=MO\` |
| 每周五 / Every Friday | \`RRULE:FREQ=WEEKLY;BYDAY=FR\` |
| 每周一三五 / Mon, Wed, Fri | \`RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\` |
| 每周二四 / Tue, Thu | \`RRULE:FREQ=WEEKLY;BYDAY=TU,TH\` |
| 每周一到周五 / Monday to Friday | \`RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\` |

### Day-of-Month Patterns (按月日重复)

| User Request | RRULE Value |
|--------------|-------------|
| 每月1号 / 1st of each month | \`RRULE:FREQ=MONTHLY;BYMONTHDAY=1\` |
| 每月15号 / 15th of each month | \`RRULE:FREQ=MONTHLY;BYMONTHDAY=15\` |
| 每月25号 / 25th of each month | \`RRULE:FREQ=MONTHLY;BYMONTHDAY=25\` |
| 每月最后一天 / Last day of month | \`RRULE:FREQ=MONTHLY;BYMONTHDAY=-1\` |
| 每月1号和15号 / 1st and 15th | \`RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15\` |

### With End Conditions (带结束条件)

| User Request | RRULE Value |
|--------------|-------------|
| 每天重复10次 / Daily for 10 times | \`RRULE:FREQ=DAILY;INTERVAL=1;COUNT=10\` |
| 每周重复5次 / Weekly for 5 times | \`RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=5\` |
| 每天到12月31日 / Daily until Dec 31 | \`RRULE:FREQ=DAILY;INTERVAL=1;UNTIL=20251231T235959Z\` |

### RRULE Format Pattern

\`\`\`
RRULE:FREQ=frequency;[INTERVAL=interval];[BYDAY=days];[BYMONTHDAY=days];[COUNT=count];[UNTIL=date]
\`\`\`

**Required Component:**
- \`RRULE:\` - Required prefix
- \`FREQ\` - Frequency (DAILY, WEEKLY, MONTHLY, YEARLY)

**Optional Components:**
- \`INTERVAL\` - How often (1 = every, 2 = every other, etc.). Default is 1 if omitted.
- \`BYDAY\` - Days of week (MO, TU, WE, TH, FR, SA, SU). Comma-separated for multiple days.
- \`BYMONTHDAY\` - Day(s) of month (1-31, or -1 for last day). Comma-separated for multiple days.
- \`BYMONTH\` - Month(s) of year (1-12). Comma-separated for multiple months.
- \`COUNT\` - Number of occurrences before stopping.
- \`UNTIL\` - End date in ISO format (YYYYMMDDTHHMMSSZ).

**Day Abbreviations:**
- \`MO\` = Monday (周一/星期一)
- \`TU\` = Tuesday (周二/星期二)
- \`WE\` = Wednesday (周三/星期三)
- \`TH\` = Thursday (周四/星期四)
- \`FR\` = Friday (周五/星期五)
- \`SA\` = Saturday (周六/星期六)
- \`SU\` = Sunday (周日/星期日)

---

## Usage Examples in Task Creation

### Example 1: Task with reminder 30 minutes before
\`\`\`json
{
  "title": "Team meeting",
  "dueDate": "2025-06-15T10:00:00+08:00",
  "reminders": ["TRIGGER:-PT30M"]
}
\`\`\`

### Example 2: Daily recurring task at 9 AM with on-time reminder
\`\`\`json
{
  "title": "Daily standup",
  "dueDate": "2025-06-15T09:00:00+08:00",
  "reminders": ["TRIGGER:PT0S"],
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1"
}
\`\`\`

### Example 3: Weekly task on Monday and Wednesday with multiple reminders
\`\`\`json
{
  "title": "Exercise",
  "dueDate": "2025-06-15T18:00:00+08:00",
  "reminders": ["TRIGGER:-PT1H", "TRIGGER:-PT15M"],
  "repeatFlag": "RRULE:FREQ=WEEKLY;BYDAY=MO,WE"
}
\`\`\`

### Example 4: Monthly bill reminder on the 25th
\`\`\`json
{
  "title": "Pay rent",
  "dueDate": "2025-06-25T10:00:00+08:00",
  "reminders": ["TRIGGER:-P1D", "TRIGGER:PT0S"],
  "repeatFlag": "RRULE:FREQ=MONTHLY;BYMONTHDAY=25"
}
\`\`\`

---

## Notes

- TRIGGER and RRULE formats follow RFC 5545 (iCalendar) specification
- The \`reminders\` parameter expects an array of TRIGGER strings
- The \`repeatFlag\` parameter expects a single RRULE string
- Time-based durations (hours, minutes, seconds) require the \`T\` designator after \`P\`
- Date-based durations (days, weeks) do NOT use the \`T\` designator
- For UNTIL dates, use UTC format: YYYYMMDDTHHMMSSZ
`;

/**
 * Register the iCalendar format reference resource
 */
export const registerICalendarFormatResource: ResourceRegistrationFunction = (server) => {
    server.registerResource(
        "icalendar-format",
        "dida365://icalendar-format",
        {
            description: `iCalendar (RFC 5545) format reference for Dida365/TickTick reminders and repeat rules.
Provides TRIGGER format documentation for the reminders parameter and RRULE format documentation for the repeatFlag parameter.
Read this resource when users request reminders (提醒) or repeat rules (重复) to correctly format the parameter values.
当用户请求设置提醒或重复规则时，阅读此资源以正确格式化参数值。`,
            mimeType: "text/markdown",
        },
        async () => {
            return {
                contents: [
                    {
                        uri: "dida365://icalendar-format",
                        mimeType: "text/markdown",
                        text: ICALENDAR_FORMAT_REFERENCE,
                    },
                ],
            };
        }
    );
};

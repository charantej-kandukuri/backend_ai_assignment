# How the platform works

We sell temperature monitoring for pharmaceutical shipments. Each customer company is an
**org**. Our customers include direct competitors (in the fixture data, Acme Pharma and Globex
Logistics), and they all run on the same platform and the same database.

Our customers are regulated (GxP). During an inspection, an auditor can ask a customer who could
see or change a shipment record, and who gave them that access. The customer answers from our audit log.

## Concepts

- **Members.** A person can belong to more than one org; each is a separate membership. A
  membership can be **suspended** (set by a separate admin service; this service only reads the flag).
- **Groups.** In each org, a member belongs to one group, which decides what they can do. Every
  org has three: **Owner** (the customer's account holders), **Admin** (day-to-day access) and
  **Viewer** (read only). Orgs can also create custom groups, such as "EU Ops".
- **Tags.** Shipments carry tags, such as `tag-cold` (2-8 °C) or `tag-eu`. A group with
  `all_tags: true` covers every shipment in its org; otherwise it covers only shipments carrying
  one of its tags. Owner, Admin and Viewer always have all tags.

| Group | View shipments | Edit shipments | Move people between groups |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Admin | yes | yes | yes |
| Viewer | yes | no | no |
| Custom | chosen by the customer | chosen by the customer | chosen by the customer |

In the code these are `shipments.view`, `shipments.edit` and `groups.manage`.

## Requirements

1. **Org isolation.** Nothing belonging to one org may be shown to, sent to, or changed by
   anyone outside that org. This includes notifications.
2. **Access follows membership.** A suspended member has no access to that org. A member who has
   not been put in any group has Viewer access.
3. **There is always an Owner.** Only Owners can make someone an Owner, and an org must never
   end up with zero Owners. If it did, nobody at the customer could get Owner access back.
4. **Every group change is audited.** Each change records who made it, which user, the previous
   group and the new group. Old assignments are soft-deleted (`deleted: true`), never removed.

# Notifications Feature

Identity: Communication Center.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `NotificationsLayout -> NotificationsHome -> NotificationInbox, AnnouncementList, NotificationComposer, NotificationSettings`.
3. Layout architecture: inbox and announcement workspace with compact reading panel.
4. State management: unread counts, selected notification, filters, and compose state.
5. API layer: `notificationApi` wraps notification and announcement endpoints only.
6. Hooks: `useNotifications`, `useUnreadCount`, `useAnnouncements`, `useNotificationActions`.
7. Types: `Notification`, `Announcement`, `NotificationPriority`, `NotificationStatus`.
8. Utilities: priority labels, read-state helpers, notification grouping.
9. Responsive strategy: inbox and detail view become stacked screens on mobile.
10. Reusable components: shared `Badge`, `Toast`, `Modal`, `Search`, `Button`.
11. Performance: isolated polling, memoized unread count, lazy composer.
12. Scalability: channel model supports in-app, email, SMS, and future integrations.

/**
 * Global Configuration for Condominium Booking System.
 * Accessible across all backend Google Apps Script files.
 */

// Calendar ID for Google Calendar Integration
const CALENDAR_ID = '5e250418f97d2008bff93cc10a638b2aabe981af2d5e271b058eb8835dde2ae2@group.calendar.google.com';

// Notification recipient for host
const HOST_NOTIFICATION_EMAIL = typeof Session !== 'undefined' && Session.getEffectiveUser ? Session.getEffectiveUser().getEmail() : 'host@example.com';

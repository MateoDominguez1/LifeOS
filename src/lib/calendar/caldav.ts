import { DAVClient } from "tsdav";

const ICLOUD_SERVER_URL = "https://caldav.icloud.com";
const LIFEOS_CALENDAR_NAME = "LifeOS";

export interface CalDAVCredentials {
  email: string;
  appSpecificPassword: string;
}

export interface ConnectResult {
  calendarHomeUrl: string;
  lifeosCalendarUrl: string;
}

async function getClient({ email, appSpecificPassword }: CalDAVCredentials): Promise<DAVClient> {
  const client = new DAVClient({
    serverUrl: ICLOUD_SERVER_URL,
    credentials: { username: email, password: appSpecificPassword },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();
  return client;
}

function calendarDisplayName(name: string | Record<string, unknown> | undefined): string {
  return typeof name === "string" ? name : "";
}

/** Connects to iCloud, discovers the calendar home, and finds or creates the
 * dedicated "LifeOS" calendar. Safe to call again later — it reuses the
 * existing calendar instead of creating a duplicate. */
export async function connectAndEnsureCalendar(credentials: CalDAVCredentials): Promise<ConnectResult> {
  const client = await getClient(credentials);
  const homeUrl = client.account?.homeUrl;
  if (!homeUrl) {
    throw new Error("No pudimos descubrir el calendario de tu cuenta de iCloud. Revisá el email y la contraseña de aplicación.");
  }

  const calendars = await client.fetchCalendars();
  const existing = calendars.find((c) => calendarDisplayName(c.displayName) === LIFEOS_CALENDAR_NAME);
  if (existing) {
    return { calendarHomeUrl: homeUrl, lifeosCalendarUrl: existing.url };
  }

  const calendarUrl = new URL(`lifeos-${Date.now()}/`, homeUrl).href;
  await client.makeCalendar({
    url: calendarUrl,
    props: { displayname: LIFEOS_CALENDAR_NAME },
  });

  return { calendarHomeUrl: homeUrl, lifeosCalendarUrl: calendarUrl };
}

export interface UpsertEventParams extends CalDAVCredentials {
  calendarUrl: string;
  existingEventUrl?: string | null;
  existingEtag?: string | null;
  uid: string;
  iCalString: string;
}

export interface UpsertEventResult {
  url: string;
  etag: string | null;
}

export async function upsertEvent(params: UpsertEventParams): Promise<UpsertEventResult> {
  const client = await getClient(params);
  const filename = `${params.uid}.ics`;

  if (params.existingEventUrl) {
    const res = await client.updateCalendarObject({
      calendarObject: {
        url: params.existingEventUrl,
        data: params.iCalString,
        etag: params.existingEtag ?? undefined,
      },
    });
    if (!res.ok) {
      throw new Error(`iCloud respondió ${res.status} al actualizar el evento.`);
    }
    return { url: params.existingEventUrl, etag: res.headers.get("etag") };
  }

  const res = await client.createCalendarObject({
    calendar: { url: params.calendarUrl },
    iCalString: params.iCalString,
    filename,
  });
  if (!res.ok) {
    throw new Error(`iCloud respondió ${res.status} al crear el evento.`);
  }
  return { url: new URL(filename, params.calendarUrl).href, etag: res.headers.get("etag") };
}

export interface DeleteEventParams extends CalDAVCredentials {
  eventUrl: string;
  etag?: string | null;
}

export async function deleteEvent(params: DeleteEventParams): Promise<void> {
  const client = await getClient(params);
  const res = await client.deleteCalendarObject({
    calendarObject: { url: params.eventUrl, etag: params.etag ?? undefined },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`iCloud respondió ${res.status} al borrar el evento.`);
  }
}

export default async () => {
  const hosts = ['https://us.i.posthog.com', 'https://eu.i.posthog.com'];
  const host = process.env.POSTHOG_HOST || hosts[0];
  return Response.json({
    key: hosts.includes(host) ? (process.env.POSTHOG_PUBLIC_KEY || '') : '',
    host: hosts.includes(host) ? host : hosts[0],
  }, { headers: { 'Cache-Control': 'no-store' } });
};

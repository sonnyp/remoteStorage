export async function lookup(
  resource: string,
  options: RequestInit = {},
  uri?: string,
) {
  let domain;

  const resourceURL = new URL(resource);
  if (resourceURL.protocol === "acct:") {
    domain = resource.split("@")[1];
  } else {
    domain = resourceURL.hostname;
  }

  const url = new URL(uri || `https://${domain}/.well-known/webfinger`);
  url.searchParams.append("resource", resource);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Accept: "application/jrd+json",
      ...options.headers,
    },
  });
  return response.json();
}

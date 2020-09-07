import HTTPError from "./HTTPError";

export function getDomain(resource: URL | string): string {
  let domain;

  const url = new URL(resource.toString());

  if (url.protocol === "acct:") {
    const idx = resource.toString().lastIndexOf("@");
    domain = resource.toString().substring(idx + 1);
  } else {
    domain = url.hostname;
  }

  return domain;
}

export async function lookup(
  resource: URL | string,
  url?: URL | string,
): Promise<any> {
  const domain = getDomain(resource);

  url = new URL(url?.toString() || `https://${domain}/.well-known/webfinger`);
  url.searchParams.append("resource", resource.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/jrd+json",
    },
  });

  if (response.status !== 200) {
    throw new HTTPError(response);
  }

  return response.json();
}

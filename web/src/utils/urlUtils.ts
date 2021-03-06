export class UrlService {
  static dashboard = () => "/";
  static blocks = () => "/blocks";
  static block = (height: number) => `/blocks/${height}`;
  static transactions = () => "/transactions";
  static transaction = (hash: string) => `/transactions/${hash}`;
}

export function appendSearchParams(params) {
  const urlParams = new URLSearchParams("");
  Object.keys(params).forEach(p => {
    if (params[p]) {
      urlParams.set(p, params[p]);
    }
  });

  const res = urlParams.toString();

  return !!res ? `?${res}` : res;
}

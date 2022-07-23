export class UrlService {
  static dashboard = () => "/";
  static blocks = () => "/blocks";
  static block = (height: number) => `/blocks/${height}`;
  static transactions = () => "/transactions";
  static transaction = (hash: string) => `/transactions/${hash}`;
  static address = (address: string) => `/addresses/${address}`;
  static validators = () => "/validators";
  static validator = (address: string) => `/validators/${address}`;
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

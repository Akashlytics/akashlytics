export const donationAddress = "akash13265twfqejnma6cc93rw5dxk4cldyz2zyy8cdm";

export enum SelectedRange {
  "7D" = 7,
  "1M" = 30,
  "ALL" = Number.MAX_SAFE_INTEGER
}

export const baseApiUrl =
  window.location.hostname === "localhost" ? "http://localhost:3080" : `${window.location.protocol}//api.${window.location.hostname.replace(/^(www\.)/, "")}`;

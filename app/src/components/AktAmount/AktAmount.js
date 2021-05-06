import React from "react";
import { FormattedNumber } from "react-intl";

export default function AktAmount(props) {
  if (props.showInUSD) {
    return (
      <>
        <FormattedNumber
          value={(props.uakt / 1000000) * props.usdPrice}
          style="currency"
          currency="USD"
        />
      </>
    );
  } else {
    return (
      <>
        <FormattedNumber value={props.uakt / 1000000} /> akt
      </>
    );
  }
}

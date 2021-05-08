import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Typography,
} from "@material-ui/core";
import clsx from "clsx";
import { FormattedNumber, useIntl } from "react-intl";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: 30,
    paddingBottom: 100,
  },
}));

export function PriceCompare({ marketData }) {
  const classes = useStyles();
  const [priceComparisons, setPriceComparisons] = useState(null);
  const intl = useIntl();

  // useEffect(() => {
  //   async function getPriceCompare() {
  //     const res = await fetch("/data/price-comparisons.json");
  //     const data = await res.json();

  //     if (data) {
  //       setPriceComparisons(data);
  //     }
  //   }

  //   getPriceCompare();
  // }, []);

  return <div className={clsx(classes.root, "container")}></div>;
}

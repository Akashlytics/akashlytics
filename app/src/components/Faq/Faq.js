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
  table: {
    minWidth: 650,
  },
  pageTitle: {
    color: "white",
    fontWeight: "bold",
  },
  pageSubTitle: {
    color: "white",
    marginBottom: "3rem",
  },
  tableHeader: {
    textTransform: "uppercase",
  },
  dataCell: {
    verticalAlign: "initial",
    borderBottom: "none",
  },
  discountCell: {
    padding: 8,
  },
  discountChip: {
    backgroundColor: "#0d900d",
    fontWeight: "bold",
  },
  discountLabel: {
    fontWeight: "bold",
    fontSize: "1rem",
  },
  tableRow: {
    "&:last-child td": {
      paddingBottom: 20,
    },
  },
  disclaimerRow: {
    marginTop: 50,
  },
  disclaimerTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: "1rem",
    textAlign: "left",
  },
  disclaimerList: {
    color: "white",
    textDecoration: "none",
    textAlign: "left",
  },
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
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

  return (
    <div className={clsx(classes.root, "container")}>
      
    </div>
  );
}
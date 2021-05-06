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

  // get the users
  useEffect(() => {
    async function getPriceCompare() {
      const res = await fetch("/data/price-comparisons.json");
      const data = await res.json();

      if (data) {
        setPriceComparisons(data);
      }
    }

    getPriceCompare();
  }, []);

  return (
    <div className={clsx(classes.root, "container")}>
      <div className="row">
        <div className="col-xs-12">
          <Typography variant="h3" className={classes.pageTitle}>
            Akash vs. Cloud giants
          </Typography>
          <Typography variant="h5" className={classes.pageSubTitle}>
            A simple price comparison
          </Typography>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12">
          {!priceComparisons || !marketData ? (
            <CircularProgress size={80} />
          ) : (
            <TableContainer component={Paper}>
              <Table className={classes.table} aria-label="price comparisons">
                <TableHead className={classes.tableHeader}>
                  <TableRow>
                    <TableCell align="center" width="10%">
                      type
                    </TableCell>
                    {priceComparisons.providers.map((provider) => (
                      <TableCell key={provider.key} align="center">
                        {provider.title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceComparisons.rows.map((row, rowIndex) => {
                    const akashCell = row.cells.filter((c) => c.provider === "akash")[0];
                    const akashPrice = akashCell.amount * 0.432 * marketData.computedPrice;

                    return (
                      <React.Fragment key={row.type}>
                        <TableRow>
                          <TableCell
                            align="center"
                            component="th"
                            scope="row"
                            className={classes.dataCell}
                          >
                            {row.type}
                          </TableCell>
                          {row.cells.map((cell) => (
                            <ProviderCell
                              key={`${cell.provider}_${cell.amount}_${cell.unit}`}
                              cell={cell}
                              marketData={marketData}
                            />
                          ))}
                        </TableRow>

                        <TableRow size="small" className={classes.tableRow}>
                          <TableCell
                            align="center"
                            component="th"
                            scope="row"
                            className={classes.discountCell}
                          ></TableCell>
                          {row.cells.map((cell, i) => {
                            const isAkash = cell.provider === "akash";

                            return (
                              <TableCell
                                key={`discount_${rowIndex}_${i}_${cell.provider}_${cell.amount}_${cell.unit}`}
                                align="center"
                                className={classes.discountCell}
                              >
                                {!isAkash ? (
                                  <Chip
                                    className={classes.discountChip}
                                    size="small"
                                    label={intl.formatNumber(
                                      +(akashPrice - cell.amount) / cell.amount,
                                      { style: "percent", maximumFractionDigits: 2 }
                                    )}
                                  />
                                ) : (
                                  <div className={classes.discountLabel}>Akash discount:</div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>

      <div className={clsx("row", classes.disclaimerRow)}>
        <div className="col-xs-12">
          <Typography variant="h4" className={classes.disclaimerTitle}>
            Disclaimer
          </Typography>

          <u className={classes.disclaimerList}>
            <li>
              These prices may vary. I strongly suggest that you do your own research as I might
              have miss-calculated some of the providers pricing.
            </li>
            <li>
              The specifications used for comparisons are mostly focused on CPU and RAM as storage
              is usually rather cheap.
            </li>
            <li>
              As of today, the minimum pricing for a lease on akash is 1uakt (.000001akt) per block
              at an average of 1 block per 6 second, which gives ~.423akt/month. To counter the rise
              of prices, Akash will introduce fractional pricing which will enable even lower
              prices. Please refer to this{" "}
              <a
                href="https://akash.network/blog/akash-mainnet-2-update-april-29-2021/"
                target="_blank"
                className={classes.link}
              >
                article.
              </a>
            </li>
            <li>
              To calculate the pricing for Akash, I created a deployment with the given
              specifications and took the best available bid. This might change in the future.
            </li>
            <li>
              <a
                href="https://calculator.s3.amazonaws.com/index.html"
                target="_blank"
                className={classes.link}
              >
                Amazon Web Service pricing calculator
              </a>
            </li>
            <li>
              <a
                href="https://cloud.google.com/products/calculator"
                target="_blank"
                className={classes.link}
              >
                Google cloud platform pricing calculator
              </a>
            </li>
            <li>
              <a
                href="https://azure.microsoft.com/en-us/pricing/calculator/"
                target="_blank"
                className={classes.link}
              >
                Microsoft Azure pricing calculator
              </a>
            </li>
          </u>
        </div>
      </div>
    </div>
  );
}

const useCellStyles = makeStyles((theme) => ({
  root: {
    verticalAlign: "initial",
    borderBottom: "none",
  },
  amount: {
    fontWeight: "bold",
    fontSize: "1rem",
    paddingBottom: "5px",
  },
  aktAmount: {
    marginTop: ".5rem",
  },
  unitContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  unitLabel: {
    flexBasis: "50%",
    textAlign: "right",
    paddingRight: 5,
  },
  unitValue: {
    flexBasis: "50%",
    textAlign: "left",
    paddingLeft: 5,
    fontWeight: "bold",
  },
}));

const ProviderCell = ({ cell, marketData }) => {
  const isAkash = cell.provider === "akash";
  const classes = useCellStyles();

  return (
    <TableCell align="center" className={classes.root}>
      <div className={classes.amount}>
        {isAkash ? (
          <div>
            <FormattedNumber
              value={cell.amount * 0.432 * marketData.computedPrice}
              style="currency"
              currency="USD"
            />
          </div>
        ) : (
          <FormattedNumber value={cell.amount} style="currency" currency="USD" />
        )}
      </div>
      <div className={classes.unitContainer}>
        <div className={classes.unitLabel}>cpu:</div>
        <div className={classes.unitValue}>{cell.cpu}</div>
      </div>
      <div className={classes.unitContainer}>
        <div className={classes.unitLabel}>ram:</div>
        <div className={classes.unitValue}>{cell.ram}</div>
      </div>

      {cell.machineType && (
        <div className={classes.unitContainer}>
          <div className={classes.unitLabel}>type:</div>
          <div className={classes.unitValue}>{cell.machineType}</div>
        </div>
      )}
      {cell.storage && (
        <div className={classes.unitContainer}>
          <div className={classes.unitLabel}>storage:</div>
          <div className={classes.unitValue}>{cell.storage}</div>
        </div>
      )}

      {isAkash && <div className={classes.aktAmount}>({cell.amount} uakt)</div>}
    </TableCell>
  );
};

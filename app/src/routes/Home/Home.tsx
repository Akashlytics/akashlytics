import React from "react";
import clsx from "clsx";
import { CircularProgress } from "@material-ui/core";
import { Helmet } from "react-helmet-async";
import { useStyles } from "./Home.styles";
import { Dashboard } from "../../components/Dashboard";
import { DashboardData } from "@src/shared/models";
import { FormattedDate, FormattedTime } from "react-intl";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { useDashboardData } from "@src/queries/useDashboardData";

export interface IHomeProps {}

export const Home: React.FunctionComponent<IHomeProps> = ({}) => {
  const { data: dashboardData, status } = useDashboardData();
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <>
      <Helmet title="Dashboard" />
      <div className={clsx("container")}>
        {dashboardData ? (
          <>
            <Dashboard dashboardData={dashboardData} />

            <div className="row mt-5">
              <div
                className={clsx("col-12", classes.refreshDate, {
                  "text-center": mediaQuery.smallScreen
                })}
              >
                Last updated: <FormattedDate value={dashboardData.now.date} /> <FormattedTime value={dashboardData.now.date} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <CircularProgress size={80} />
          </div>
        )}
      </div>
    </>
  );
};

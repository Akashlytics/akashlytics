import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { makeStyles } from "tss-react/mui";
import Layout from "@src/components/layout/Layout";
import { cx } from "@emotion/css";
import PageContainer from "@src/components/shared/PageContainer";
import { BASE_API_URL } from "@src/utils/constants";
import axios from "axios";
import Error from "@src/components/shared/Error";
import { udenomToDemom } from "@src/utils/mathHelpers";
import { AKTLabel } from "@src/components/shared/AKTLabel";
import { ValidatorDetail } from "@src/types/validator";
import { FormattedNumber } from "react-intl";
import { useEffect, useState } from "react";
import { Avatar } from "@mui/material";

type Props = {
  errors?: string;
  address: string;
  validator: ValidatorDetail;
};

const useStyles = makeStyles()(theme => ({
  root: {
    paddingTop: "2rem",
    paddingBottom: "2rem",
    marginLeft: "0"
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginLeft: ".5rem",
    marginBottom: "1rem"
  },
  titleSmall: {
    fontSize: "1.1rem"
  },
  validatorInfoRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
    "&:last-child": {
      marginBottom: 0
    }
  },
  label: {
    fontWeight: "bold",
    maxWidth: "10rem",
    flex: "1 1 0px",
    flexBasis: 0
  },
  value: {
    wordBreak: "break-all",
    overflowWrap: "anywhere"
  }
}));

const ValidatorDetailPage: React.FunctionComponent<Props> = ({ address, validator, errors }) => {
  const [identity, setIdentity] = useState(null);

  if (errors) return <Error errors={errors} />;

  const { classes } = useStyles();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    axios
      .get(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${validator.identity}`)
      .then(res => {
        if (res.data.status.name === "OK" && res.data.them.length > 0) {
          setIdentity({
            profileUrl: res.data.them[0].basics?.username && `https://keybase.io/${res.data.them[0].basics.username}`,
            avatarUrl: res.data.them[0].pictures?.primary?.url
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  }, [validator.identity]);

  return (
    <Layout title={`Validator ${validator.moniker}`} appendGenericTitle>
      <PageContainer>
        <Typography variant="h1" className={cx(classes.title, { [classes.titleSmall]: matches })}>
          Details for Validator {validator.moniker}
        </Typography>

        <Paper sx={{ padding: 2 }}>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Moniker</div>
            <div className={classes.value}>
              {identity?.avatarUrl && <Avatar src={identity?.avatarUrl} />}
              {validator.moniker}
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Operator Address</div>
            <div className={classes.value}>{validator.operatorAddress}</div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Voting Power</div>
            <div className={classes.value}>
              <FormattedNumber value={udenomToDemom(validator.votingPower)} maximumFractionDigits={0} />
              &nbsp;
              <AKTLabel />
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Commission</div>
            <div className={classes.value}>
              <FormattedNumber style="percent" value={validator.commission} minimumFractionDigits={2} />
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Max Commission</div>
            <div className={classes.value}>
              <FormattedNumber style="percent" value={validator.maxCommission} minimumFractionDigits={2} />
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Max Commission Change</div>
            <div className={classes.value}>
              <FormattedNumber style="percent" value={validator.maxCommissionChange} minimumFractionDigits={2} />
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Website</div>
            <div className={classes.value}>
              {validator.website && (
                <a href={validator.website} target="_blank">
                  {validator.website}
                </a>
              )}
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Identity</div>
            <div className={classes.value}>
              {identity?.profileUrl ? (
                <a href={identity?.profileUrl} target="_blank">
                  {validator.identity}
                </a>
              ) : (
                <>{validator.identity}</>
              )}
            </div>
          </div>
          <div className={classes.validatorInfoRow}>
            <div className={classes.label}>Description</div>
            <div className={classes.value}>{validator.description}</div>
          </div>
        </Paper>
      </PageContainer>
    </Layout>
  );
};

export default ValidatorDetailPage;

export async function getServerSideProps({ params }) {
  const validator = await fetchValidatorData(params?.address);

  return {
    props: {
      address: params?.address,
      validator
    }
  };
}

async function fetchValidatorData(address: string) {
  const response = await axios.get(`${BASE_API_URL}/api/validators/${address}`);
  return response.data;
}

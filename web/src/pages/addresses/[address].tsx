import Box from "@mui/material/Box";
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
import { FormattedDate, FormattedRelativeTime } from "react-intl";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import Table from "@mui/material/Table";
import { AddressDetail } from "@src/types/address";
import { UrlService } from "@src/utils/urlUtils";
import { udenomToDemom } from "@src/utils/mathHelpers";
import { AKTLabel } from "@src/components/shared/AKTLabel";

type Props = {
  errors?: string;
  address: string;
  addressDetail: AddressDetail;
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
  addressInfoRow: {
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

const AddressDetailPage: React.FunctionComponent<Props> = ({ address, addressDetail, errors }) => {
  if (errors) return <Error errors={errors} />;

  const { classes } = useStyles();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Layout title={`Account ${address}`} appendGenericTitle>
      <PageContainer>
        <Typography variant="h1" className={cx(classes.title, { [classes.titleSmall]: matches })}>
          Details for Account {address}
        </Typography>

        <Paper sx={{ padding: 2 }}>
          <div className={classes.addressInfoRow}>
            <div className={classes.label}>Address</div>
            <div className={classes.value}>{address}</div>
          </div>
          <div className={classes.addressInfoRow}>
            <div className={classes.label}>Available</div>
            <div className={classes.value}>
              {udenomToDemom(addressDetail.available)}&nbsp;
              <AKTLabel />
            </div>
          </div>
          <div className={classes.addressInfoRow}>
            <div className={classes.label}>Delegated</div>
            <div className={classes.value}>
              {udenomToDemom(addressDetail.delegated)}&nbsp;
              <AKTLabel />
            </div>
          </div>
          <div className={classes.addressInfoRow}>
            <div className={classes.label}>Rewards</div>
            <div className={classes.value}>
              {udenomToDemom(addressDetail.rewards)}&nbsp;
              <AKTLabel />
            </div>
          </div>
          <div className={classes.addressInfoRow}>
            <div className={classes.label}>Total Balance</div>
            <div className={classes.value}>
              {udenomToDemom(addressDetail.total)}&nbsp;
              <AKTLabel />
            </div>
          </div>
        </Paper>

        <Box sx={{ mt: "1rem" }}>
          <Typography variant="h3" sx={{ fontSize: "1.5rem", mb: "1rem", fontWeight: "bold", marginLeft: ".5rem" }}>
            Assets
          </Typography>

          <Paper sx={{ padding: 2 }}>
            <TableContainer sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Amount</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {addressDetail.assets.map(asset => (
                    <TableRow key={asset.denom}>
                      <TableCell>{asset.denom}</TableCell>
                      <TableCell align="center">{asset.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        <Box sx={{ mt: "1rem" }}>
          <Typography variant="h3" sx={{ fontSize: "1.5rem", mb: "1rem", fontWeight: "bold", marginLeft: ".5rem" }}>
            Delegations
          </Typography>

          <Paper sx={{ padding: 2 }}>
            <TableContainer sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Validator</TableCell>
                    <TableCell align="center">Amount</TableCell>
                    <TableCell align="center">Reward</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {addressDetail.delegations.map(delegation => (
                    <TableRow key={delegation.validator}>
                      <TableCell>
                        {delegation.validator}
                        {/* TODO: add link to validator page + name */}
                      </TableCell>
                      <TableCell align="center">
                        {udenomToDemom(delegation.amount, 6)}&nbsp;
                        <AKTLabel />
                      </TableCell>
                      <TableCell align="center">
                        {udenomToDemom(delegation.reward, 6)}&nbsp;
                        <AKTLabel />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </PageContainer>
    </Layout>
  );
};

export default AddressDetailPage;

export async function getServerSideProps({ params }) {
  const addressDetail = await fetchAddressData(params?.address);

  return {
    props: {
      address: params?.address,
      addressDetail
    }
  };
}

async function fetchAddressData(address: string) {
  const response = await axios.get(`${BASE_API_URL}/api/addresses/${address}`);
  return response.data;
}

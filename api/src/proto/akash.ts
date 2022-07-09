import { GeneratedType } from "@cosmjs/proto-signing";

// v1beta1 Messages
import * as akash_audit_v1beta1_audit_types from "@akashnetwork/akashjs/build/protobuf/akash/audit/v1beta1/audit";
import * as akash_cert_v1beta1_cert_types from "@akashnetwork/akashjs/build/protobuf/akash/cert/v1beta1/cert";
import * as akash_deployment_v1beta1_deployment_types from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta1/deployment";
import * as akash_deployment_v1beta1_group_types from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta1/group";
import * as akash_market_v1beta1_bid_types from "@akashnetwork/akashjs/build/protobuf/akash/market/v1beta1/bid";
import * as akash_market_v1beta1_lease_types from "@akashnetwork/akashjs/build/protobuf/akash/market/v1beta1/lease";
import * as akash_provider_v1beta1_provider_types from "@akashnetwork/akashjs/build/protobuf/akash/provider/v1beta1/provider";

// v1beta2 Messages
import * as akash_audit_v1beta2_audit_types from "@akashnetwork/akashjs/build/protobuf/akash/audit/v1beta2/audit";
import * as akash_cert_v1beta2_cert_types from "@akashnetwork/akashjs/build/protobuf/akash/cert/v1beta2/cert";
import * as akash_deployment_v1beta2_deployment_types from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/deploymentmsg";
import * as akash_deployment_v1beta2_group_types from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/groupmsg";
import * as akash_market_v1beta2_bid_types from "@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/bid";
import * as akash_market_v1beta2_lease_types from "@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/lease";
import * as akash_provider_v1beta2_provider_types from "@akashnetwork/akashjs/build/protobuf/akash/provider/v1beta2/provider";

export const v1beta1 = {
  MsgSignProviderAttributes: akash_audit_v1beta1_audit_types.MsgSignProviderAttributes,
  MsgSignProviderAttributesResponse: akash_audit_v1beta1_audit_types.MsgSignProviderAttributesResponse,
  MsgDeleteProviderAttributes: akash_audit_v1beta1_audit_types.MsgDeleteProviderAttributes,
  MsgDeleteProviderAttributesResponse: akash_audit_v1beta1_audit_types.MsgDeleteProviderAttributesResponse,
  MsgCreateCertificate: akash_cert_v1beta1_cert_types.MsgCreateCertificate,
  MsgCreateCertificateResponse: akash_cert_v1beta1_cert_types.MsgCreateCertificateResponse,
  MsgRevokeCertificate: akash_cert_v1beta1_cert_types.MsgRevokeCertificate,
  MsgRevokeCertificateResponse: akash_cert_v1beta1_cert_types.MsgRevokeCertificateResponse,
  MsgCreateDeployment: akash_deployment_v1beta1_deployment_types.MsgCreateDeployment,
  MsgCreateDeploymentResponse: akash_deployment_v1beta1_deployment_types.MsgCreateDeploymentResponse,
  MsgDepositDeployment: akash_deployment_v1beta1_deployment_types.MsgDepositDeployment,
  MsgDepositDeploymentResponse: akash_deployment_v1beta1_deployment_types.MsgDepositDeploymentResponse,
  MsgUpdateDeployment: akash_deployment_v1beta1_deployment_types.MsgUpdateDeployment,
  MsgUpdateDeploymentResponse: akash_deployment_v1beta1_deployment_types.MsgUpdateDeploymentResponse,
  MsgCloseDeployment: akash_deployment_v1beta1_deployment_types.MsgCloseDeployment,
  MsgCloseDeploymentResponse: akash_deployment_v1beta1_deployment_types.MsgCloseDeploymentResponse,
  MsgCloseGroup: akash_deployment_v1beta1_group_types.MsgCloseGroup,
  MsgCloseGroupResponse: akash_deployment_v1beta1_group_types.MsgCloseGroupResponse,
  MsgPauseGroup: akash_deployment_v1beta1_group_types.MsgPauseGroup,
  MsgPauseGroupResponse: akash_deployment_v1beta1_group_types.MsgPauseGroupResponse,
  MsgStartGroup: akash_deployment_v1beta1_group_types.MsgStartGroup,
  MsgStartGroupResponse: akash_deployment_v1beta1_group_types.MsgStartGroupResponse,
  MsgCreateBid: akash_market_v1beta1_bid_types.MsgCreateBid,
  MsgCreateBidResponse: akash_market_v1beta1_bid_types.MsgCreateBidResponse,
  MsgCloseBid: akash_market_v1beta1_bid_types.MsgCloseBid,
  MsgCloseBidResponse: akash_market_v1beta1_bid_types.MsgCloseBidResponse,
  MsgCreateLease: akash_market_v1beta1_lease_types.MsgCreateLease,
  MsgCreateLeaseResponse: akash_market_v1beta1_lease_types.MsgCreateLeaseResponse,
  MsgWithdrawLease: akash_market_v1beta1_lease_types.MsgWithdrawLease,
  MsgWithdrawLeaseResponse: akash_market_v1beta1_lease_types.MsgWithdrawLeaseResponse,
  MsgCloseLease: akash_market_v1beta1_lease_types.MsgCloseLease,
  MsgCloseLeaseResponse: akash_market_v1beta1_lease_types.MsgCloseLeaseResponse,
  MsgCreateProvider: akash_provider_v1beta1_provider_types.MsgCreateProvider,
  MsgCreateProviderResponse: akash_provider_v1beta1_provider_types.MsgCreateProviderResponse,
  MsgUpdateProvider: akash_provider_v1beta1_provider_types.MsgUpdateProvider,
  MsgUpdateProviderResponse: akash_provider_v1beta1_provider_types.MsgUpdateProviderResponse,
  MsgDeleteProvider: akash_provider_v1beta1_provider_types.MsgDeleteProvider,
  MsgDeleteProviderResponse: akash_provider_v1beta1_provider_types.MsgDeleteProviderResponse
};

export const v1beta2 = {
  MsgSignProviderAttributes: akash_audit_v1beta2_audit_types.MsgSignProviderAttributes,
  MsgSignProviderAttributesResponse: akash_audit_v1beta2_audit_types.MsgSignProviderAttributesResponse,
  MsgDeleteProviderAttributes: akash_audit_v1beta2_audit_types.MsgDeleteProviderAttributes,
  MsgDeleteProviderAttributesResponse: akash_audit_v1beta2_audit_types.MsgDeleteProviderAttributesResponse,
  MsgCreateCertificate: akash_cert_v1beta2_cert_types.MsgCreateCertificate,
  MsgCreateCertificateResponse: akash_cert_v1beta2_cert_types.MsgCreateCertificateResponse,
  MsgRevokeCertificate: akash_cert_v1beta2_cert_types.MsgRevokeCertificate,
  MsgRevokeCertificateResponse: akash_cert_v1beta2_cert_types.MsgRevokeCertificateResponse,
  MsgCreateDeployment: akash_deployment_v1beta2_deployment_types.MsgCreateDeployment,
  MsgCreateDeploymentResponse: akash_deployment_v1beta2_deployment_types.MsgCreateDeploymentResponse,
  MsgDepositDeployment: akash_deployment_v1beta2_deployment_types.MsgDepositDeployment,
  MsgDepositDeploymentResponse: akash_deployment_v1beta2_deployment_types.MsgDepositDeploymentResponse,
  MsgUpdateDeployment: akash_deployment_v1beta2_deployment_types.MsgUpdateDeployment,
  MsgUpdateDeploymentResponse: akash_deployment_v1beta2_deployment_types.MsgUpdateDeploymentResponse,
  MsgCloseDeployment: akash_deployment_v1beta2_deployment_types.MsgCloseDeployment,
  MsgCloseDeploymentResponse: akash_deployment_v1beta2_deployment_types.MsgCloseDeploymentResponse,
  MsgCloseGroup: akash_deployment_v1beta2_group_types.MsgCloseGroup,
  MsgCloseGroupResponse: akash_deployment_v1beta2_group_types.MsgCloseGroupResponse,
  MsgPauseGroup: akash_deployment_v1beta2_group_types.MsgPauseGroup,
  MsgPauseGroupResponse: akash_deployment_v1beta2_group_types.MsgPauseGroupResponse,
  MsgStartGroup: akash_deployment_v1beta2_group_types.MsgStartGroup,
  MsgStartGroupResponse: akash_deployment_v1beta2_group_types.MsgStartGroupResponse,
  MsgCreateBid: akash_market_v1beta2_bid_types.MsgCreateBid,
  MsgCreateBidResponse: akash_market_v1beta2_bid_types.MsgCreateBidResponse,
  MsgCloseBid: akash_market_v1beta2_bid_types.MsgCloseBid,
  MsgCloseBidResponse: akash_market_v1beta2_bid_types.MsgCloseBidResponse,
  MsgCreateLease: akash_market_v1beta2_lease_types.MsgCreateLease,
  MsgCreateLeaseResponse: akash_market_v1beta2_lease_types.MsgCreateLeaseResponse,
  MsgWithdrawLease: akash_market_v1beta2_lease_types.MsgWithdrawLease,
  MsgWithdrawLeaseResponse: akash_market_v1beta2_lease_types.MsgWithdrawLeaseResponse,
  MsgCloseLease: akash_market_v1beta2_lease_types.MsgCloseLease,
  MsgCloseLeaseResponse: akash_market_v1beta2_lease_types.MsgCloseLeaseResponse,
  MsgCreateProvider: akash_provider_v1beta2_provider_types.MsgCreateProvider,
  MsgCreateProviderResponse: akash_provider_v1beta2_provider_types.MsgCreateProviderResponse,
  MsgUpdateProvider: akash_provider_v1beta2_provider_types.MsgUpdateProvider,
  MsgUpdateProviderResponse: akash_provider_v1beta2_provider_types.MsgUpdateProviderResponse,
  MsgDeleteProvider: akash_provider_v1beta2_provider_types.MsgDeleteProvider,
  MsgDeleteProviderResponse: akash_provider_v1beta2_provider_types.MsgDeleteProviderResponse
};

export const akashTypes: ReadonlyArray<[string, GeneratedType]> = [...Object.values(v1beta1), ...Object.values(v1beta2)].map((x) => ["/" + x.$type, x]);

import { DecCoin } from "./deccoin";

const { Field, Enum, Type, Root } = require("protobufjs");

// Deployments

const DeploymentID = new Type("DeploymentID").add(new Field("owner", 1, "string")).add(new Field("dseq", 2, "uint64"));

let root = new Root().define("test").add(DeploymentID);

export const MsgCloseDeployment = new Type("MsgCloseDeployment").add(new Field("id", 1, "DeploymentID"));

const Coin = new Type("Coin").add(new Field("denom", 1, "string")).add(new Field("amount", 2, "string"));

const Kind = new Enum("Kind", { SHARED_HTTP: 0, RANDOM_PORT: 1 });

const Endpoint = new Type("Endpoint").add(new Field("kind", 1, "Kind")).add(Kind);

const Attribute = new Type("Attribute").add(new Field("key", 1, "string")).add(new Field("value", 2, "string"));

const ResourceValue = new Type("ResourceValue").add(new Field("val", 1, "string"));

const CPU = new Type("CPU")
  .add(new Field("units", 1, "ResourceValue"))
  .add(ResourceValue)
  .add(new Field("attributes", 2, "Attribute", "repeated"))
  .add(Attribute);

const Memory = new Type("Memory")
  .add(new Field("quantity", 1, "ResourceValue"))
  .add(ResourceValue)
  .add(new Field("attributes", 2, "Attribute", "repeated"))
  .add(Attribute);

const Storage = new Type("Storage")
  .add(new Field("name", 1, "string"))
  .add(new Field("quantity", 2, "ResourceValue"))
  .add(ResourceValue)
  .add(new Field("attributes", 3, "Attribute", "repeated"))
  .add(Attribute);

const ResourceUnits = new Type("ResourceUnits")
  .add(new Field("cpu", 1, "CPU"))
  .add(CPU)
  .add(new Field("memory", 2, "Memory"))
  .add(Memory)
  .add(new Field("storage", 3, "Storage", "repeated"))
  .add(Storage)
  .add(new Field("endpoints", 4, "Endpoint", "repeated"))
  .add(Endpoint);

const Resource = new Type("Resource")
  .add(new Field("resources", 1, "ResourceUnits")) // unit
  .add(ResourceUnits)
  .add(new Field("count", 2, "uint32"))
  .add(new Field("price", 3, "DecCoin"))
  .add(DecCoin);

const SignedBy = new Type("SignedBy").add(new Field("all_of", 1, "string", "repeated")).add(new Field("any_of", 2, "string", "repeated"));

const PlacementRequirements = new Type("PlacementRequirements")
  .add(new Field("signed_by", 1, "SignedBy"))
  .add(SignedBy)
  .add(new Field("attributes", 2, "Attribute", "repeated"))
  .add(Attribute);

const GroupSpec = new Type("GroupSpec")
  .add(new Field("name", 1, "string"))
  .add(new Field("requirements", 2, "PlacementRequirements"))
  .add(PlacementRequirements)
  .add(new Field("resources", 3, "Resource", "repeated"))
  .add(Resource);

export const MsgCreateDeployment = new Type("MsgCreateDeployment")
  .add(new Field("id", 1, "DeploymentID"))
  .add(new Field("groups", 2, "GroupSpec", "repeated"))
  .add(GroupSpec)
  .add(new Field("version", 3, "bytes"))
  .add(new Field("deposit", 4, "Coin"))
  .add(Coin);

const MsgUpdateDeployment = new Type("MsgUpdateDeployment")
  .add(new Field("id", 1, "DeploymentID"))
  .add(DeploymentID)
  .add(new Field("groups", 2, "GroupSpec", "repeated"))
  .add(GroupSpec)
  .add(new Field("version", 3, "bytes"));

// Certificates

const CertificateID = new Type("CertificateID").add(new Field("owner", 1, "string")).add(new Field("serial", 2, "string"));

const MsgRevokeCertificate = new Type("MsgRevokeCertificate").add(new Field("id", 1, "CertificateID")).add(CertificateID);

const MsgCreateCertificate = new Type("MsgCreateCertificate")
  .add(new Field("owner", 1, "string"))
  .add(new Field("cert", 2, "bytes"))
  .add(new Field("pubkey", 3, "bytes"));

// Leases

const BidID = new Type("BidID")
  .add(new Field("owner", 1, "string"))
  .add(new Field("dseq", 2, "uint64"))
  .add(new Field("gseq", 3, "uint32"))
  .add(new Field("oseq", 4, "uint32"))
  .add(new Field("provider", 5, "string"));

export const MsgCreateLease = new Type("MsgCreateLease").add(new Field("bid_id", 1, "BidID")).add(BidID);

const LeaseID = new Type("LeaseID")
  .add(new Field("owner", 1, "string"))
  .add(new Field("dseq", 2, "uint64"))
  .add(new Field("gseq", 3, "uint32"))
  .add(new Field("oseq", 4, "uint32"))
  .add(new Field("provider", 5, "string"));
export const MsgCloseLease = new Type("MsgCloseLease").add(new Field("lease_id", 1, "LeaseID"));

const OrderID = new Type("OrderID")
  .add(new Field("owner", 1, "string"))
  .add(new Field("dseq", 2, "uint64"))
  .add(new Field("gseq", 3, "uint32"))
  .add(new Field("oseq", 4, "uint32"));
export const MsgCreateBid = new Type("MsgCreateBid")
  .add(new Field("order_id", 1, "OrderID"))
  .add(OrderID)
  .add(new Field("provider", 2, "string"))
  .add(new Field("price", 3, "DecCoin"))
  .add(new Field("deposit", 4, "Coin"));
export const MsgCloseBid = new Type("MsgCloseBid").add(new Field("bid_id", 1, "BidID")).add(BidID);

export const MsgDepositDeployment = new Type("MsgDepositDeployment").add(new Field("id", 1, "DeploymentID")).add(new Field("amount", 2, "Coin"));

export const MsgWithdrawLease = new Type("MsgWithdrawLease").add(new Field("lease_id", 1, "LeaseID")).add(LeaseID);

const ProviderInfo = new Type("ProviderInfo").add(new Field("email", 1, "string")).add(new Field("website", 2, "string"));

export const MsgCreateProvider = new Type("MsgCreateProvider")
  .add(new Field("owner", 1, "string"))
  .add(new Field("host_uri", 2, "string"))
  .add(new Field("attributes", 3, "Attribute", "repeated"))
  .add(Attribute)
  .add(new Field("info", 4, "ProviderInfo"))
  .add(ProviderInfo);

export const MsgUpdateProvider = new Type("MsgUpdateProvider")
  .add(new Field("owner", 1, "string"))
  .add(new Field("host_uri", 2, "string"))
  .add(new Field("attributes", 3, "Attribute", "repeated"))
  .add(new Field("info", 4, "ProviderInfo"));

export const MsgDeleteProvider = new Type("MsgDeleteProvider").add(new Field("owner", 1, "string"));

root.add(MsgCreateLease);
root.add(MsgCloseLease);
root.add(MsgCloseDeployment);
root.add(MsgCreateDeployment);
root.add(MsgUpdateDeployment);
root.add(MsgCreateBid);
root.add(MsgCloseBid);
root.add(MsgDepositDeployment);
root.add(MsgWithdrawLease);
root.add(MsgCreateProvider);
root.add(MsgUpdateProvider);
root.add(MsgDeleteProvider);

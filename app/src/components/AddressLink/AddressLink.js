export default function AddressLink(props) {
  return (
    <a
      href={"https://akash.bigdipper.live/account/" + props.address}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.address}
    </a>
  );
}

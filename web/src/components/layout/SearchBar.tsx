import { useEffect, useState } from "react";
import { Button, Input } from "@mui/material";
import { fromBech32, normalizeBech32 } from "@cosmjs/encoding";
import { useRouter } from "next/router";
import { UrlService } from "@src/utils/urlUtils";

type Props = {};

enum SearchType {
  AccountAddress,
  ValidatorAddress,
  TxHash,
  BlockHeight
}

const SearchBar: React.FunctionComponent<Props> = ({}) => {
  const [searchTerms, setSearchTerms] = useState("");
  const [searchType, setSearchType] = useState<SearchType>(null);
  const router = useRouter();

  useEffect(() => {
    setSearchType(getSearchType(searchTerms));
  }, [searchTerms]);

  function onSearchTermsChange(ev) {
    setSearchTerms(ev.target.value);
  }

  function onSubmit(ev) {
    ev.preventDefault();

    const trimmedSearch = searchTerms.trim();

    if (trimmedSearch.length === 0) return;

    const searchType = getSearchType(trimmedSearch);

    switch (searchType) {
      case SearchType.AccountAddress:
        router.push(UrlService.address(normalizeBech32(trimmedSearch)));
        break;
      case SearchType.ValidatorAddress:
        router.push(UrlService.validator(normalizeBech32(trimmedSearch)));
        break;
      case SearchType.TxHash:
        router.push(UrlService.transaction(trimmedSearch.toUpperCase()));
        break;
      case SearchType.BlockHeight:
        router.push(UrlService.block(parseInt(trimmedSearch)));
        break;
    }
  }

  function getSearchType(search: string): SearchType {
    // Check if valid block height
    if (/^[0-9]+$/.test(search)) {
      return SearchType.BlockHeight;
    }
    // Check if tx hash
    else if (/^[A-Fa-f0-9]{64}$/.test(search)) {
      return SearchType.TxHash;
    } else {
      // Check if valid bech32 address
      const bech32 = parseBech32(search);
      if (bech32?.prefix === "akash") {
        return SearchType.AccountAddress;
      } else if (bech32?.prefix === "akashvaloper") {
        return SearchType.ValidatorAddress;
      }
    }

    return null;
  }

  function parseBech32(str: string) {
    try {
      return fromBech32(str);
    } catch {
      return null;
    }
  }

  function getSearchBtnLabel(searchType: SearchType) {
    switch (searchType) {
      case SearchType.AccountAddress:
        return "Search Account";
      case SearchType.ValidatorAddress:
        return "Search Validator";
      case SearchType.TxHash:
        return "Search Transaction";
      case SearchType.BlockHeight:
        return "Search Block";
      default:
        return "Search";
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input value={searchTerms} onChange={onSearchTermsChange} />
      <Button type="submit" disabled={searchType === null || !searchTerms.trim()}>
        {getSearchBtnLabel(searchType)}
      </Button>
      <br />
      {searchType === null && searchTerms.trim() && <>Invalid search term</>}
    </form>
  );
};

export default SearchBar;

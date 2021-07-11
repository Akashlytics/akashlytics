import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: 30,
    paddingBottom: 100,
    textAlign: "left",
  },
  pageTitle: {
    fontWeight: "bold",
    marginBottom: "3rem",
  },
  subTitle: {
    fontSize: "2rem",
    marginBottom: "1rem",
    fontWeight: "lighter",
  },
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  paragraph: {
    marginBottom: "2rem",
  },
  resourcesTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    fontWeight: "lighter",
  },
}));

export function Faq() {
  const classes = useStyles();

  const howToBuyLinks = [
    { title: "ascendex.com", url: "https://ascendex.com/register?inviteCode=SQFJU1NA" },
    { title: "gate.io", url: "https://www.gate.io/signup" },
    { title: "bitmart.com", url: "https://www.bitmart.com/en?r=7QJGUG" },
    { title: "digifinex.com", url: "https://www.digifinex.com/" },
    { title: "bithumb.pro", url: "https://www.bithumb.pro/" },
  ];

  const howToStakeLinks = [
    {
      title:
        "How to create your personal Akash Network(AKT) account on Cosmostation Wallet (iOS/Android/Web).",
      url: "http://bit.ly/3kACwil",
    },
    { title: "How to stake", url: "https://link.medium.com/751QRVXMrcb" },
    {
      title: "FAQ on staking",
      url: "https://johnniecosmos.medium.com/faq-on-staking-akt-6db011fb6b83",
    },
    { title: "What is staking?", url: "https://www.investopedia.com/terms/p/proof-stake-pos.asp" },
    {
      title: "Token unlock schedule",
      url: "https://docs.google.com/spreadsheets/d/1MUULetp59lgNq0z4ckVI51QdtMGvqtKOW8wRfX5R8yY",
    },
  ];

  const howToDeployLinks = [
    { title: "Official documentation", url: "https://docs.akash.network/" },
    { title: "Dev & Tech Support Discord", url: "https://discord.akash.network" },
    { title: "Akash Network Github", url: "https://github.com/ovrclk" },
    { title: "Hello world example", url: "https://github.com/tombeynon/akash-hello-world" },
    { title: "Deploy ui tool", url: "https://github.com/tombeynon/akash-deploy" },
    {
      title: "Unstoppable stack (Handshake + Skynet + Akash)",
      url: "https://github.com/bcfus/unstoppable-stack",
    },
    { title: "Ssh ubuntu image on Akash", url: "https://github.com/coffeeroaster/akash-ubuntu" },
    { title: "Akash deployer", url: "https://github.com/lhennerley/akash-deployer" },
    { title: "Akash node example", url: "https://github.com/tombeynon/akash-archive-node" },
    {
      title: "How to deploy a wordpress blog",
      url: "https://medium.com/@zJ_/how-to-deploy-a-decentralized-blog-3a5a13a6a827",
    },
    {
      title: "How I hosted my personal site on Akash for $2/month",
      url:
        "https://teeyeeyang.medium.com/how-i-hosted-my-personal-site-on-akash-for-2-month-cf07768aa0a2",
    },
    {
      title: "A step-by-step guide to deploying a SPA to Akash Network",
      url: "https://github.com/xtrip15/akash-deploy-spa",
    },
    {
      title: "Running Sovryn Node on Decentralized Cloud",
      url: "https://www.youtube.com/watch?v=Iinsjgolmu8&t=313s",
    },
    { title: "Deploying WordPress on Akash", url: "https://decentralize.sirags.us/tools/" },
  ];

  const communitiesLinks = [
    { title: "Akash Network Telegram", url: "https://t.me/AkashNW" },
    { title: "Akashians | Price & Staking", url: "https://t.me/akashianspricingstaking" },
    { title: "Akash Network Devs", url: "https://discord.gg/W8FgHENp" },
    { title: "Twitter", url: "https://twitter.com/akashnet_" },
    { title: "Reddit", url: "https://www.reddit.com/r/akashnetwork/" },
    { title: "Facebook", url: "https://www.facebook.com/akashnw" },
    { title: "Akash Russia Telegram", url: "https://t.me/akash_ru" },
    { title: "Akash Korea", url: "https://t.me/AkashNW_KR" },
    {
      title: "Akash Chinese Community",
      url: "https://akash.network/blog/akash-network-launch-chinese-community/",
    },
  ];

  return (
    <div className={clsx(classes.root, "container")}>
      <Helmet title="FAQ">
        <meta
          name="description"
          content="Learn more about the akash network and get answers to the most frequently asked questions."
        />
      </Helmet>

      <div className="row">
        <div className="col-xs-12">
          <Typography variant="h3" className={classes.pageTitle}>
            Frequently Asked Questions
          </Typography>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12">
          <Typography variant="h3" className={classes.subTitle}>
            What is Akash?
          </Typography>

          <p className={classes.paragraph}>
            <a
              href="https://akash.network/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              Akash Network
            </a>{" "}
            is the world’s first decentralized open source cloud. Almost every website or app you go
            to are hosted on the “cloud”, meaning servers leased by big companies like Amazon,
            Google, Microsoft or others. Akash is aiming to disrupt this centralization of resources
            by providing a decentralized network of server providers, giving the possibility for
            anyone capable to rent their spare server capacity and earn an extra income. Think
            AirBnb, but for cloud computing! On the other hand, anyone who wants to host an app or a
            website can now do it at a{" "}
            <Link to="/price-compare" className={classes.link}>
              fraction of the cost.
            </Link>{" "}
            To fulfill the transactions done between the parties, Akash uses the{" "}
            <a
              href="https://coinmarketcap.com/currencies/akash-network/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              blockchain technology
            </a>{" "}
            so that all the transactions are transparent, fast, global and cheap. Akash is part of
            the cosmos ecosystem as it is built with the{" "}
            <a
              href="https://v1.cosmos.network/sdk"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              Cosmos SDK.
            </a>
          </p>

          <Typography variant="h3" className={classes.subTitle}>
            How to deploy an app or website to Akash?
          </Typography>

          <p className={classes.paragraph}>
            Akash leverages{" "}
            <a
              href="https://kubernetes.io/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              Kubernetes's container orchestration technology
            </a>{" "}
            to provide a maximum of flexibility in terms of what applications can be deployed on
            it’s network. So basically, if your application is containerized with{" "}
            <a
              href="https://www.docker.com/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              docker
            </a>
            , it can run on Akash. The only thing you need is the currency{" "}
            <a
              href="https://coinmarketcap.com/currencies/akash-network/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              $AKT
            </a>{" "}
            to pay for the computing and then voilà, you can{" "}
            <a
              href="https://docs.akash.network/guides/deploy"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              deploy your app in a few steps.
            </a>
          </p>

          <Typography variant="h3" className={classes.subTitle}>
            What can be deployed on Akash?
          </Typography>

          <p>
            Any app, website, blockchain node, video game server, etc. You name it! As long as you
            have a docker image ready, you can run it on Akash!
          </p>
          <p className={classes.paragraph}>
            <a
              href="https://github.com/ovrclk/awesome-akash"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              Here’s a list of projects deployed by the community on the network during the testnet.
            </a>
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Typography variant="h3" className={clsx(classes.pageTitle, "mb-2", "mt-4")}>
            Resources
          </Typography>
          <Typography variant="h3" className={clsx(classes.resourcesTitle, "mb-5")}>
            Here's a list of of useful links from the community that could help to get from buying
            the currency to deploying an app!
          </Typography>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Typography variant="h5" className={clsx(classes.resourcesTitle)}>
            #1: How to buy{" "}
            <a
              href="https://coinmarketcap.com/currencies/akash-network/"
              target="_blank"
              rel="noopener"
              className={classes.link}
            >
              $AKT
            </a>
          </Typography>

          <ul>
            {howToBuyLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className={classes.link}
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>

          <Typography variant="h5" className={clsx(classes.resourcesTitle)}>
            #2: How to stake
          </Typography>

          <ul>
            {howToStakeLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className={classes.link}
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>

          <Typography variant="h5" className={clsx(classes.resourcesTitle)}>
            #3: How to deploy
          </Typography>

          <ul>
            {howToDeployLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className={classes.link}
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>

          <Typography variant="h3" className={clsx(classes.pageTitle, "mb-4", "mt-4")}>
            Community
          </Typography>

          <ul>
            {communitiesLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className={classes.link}
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

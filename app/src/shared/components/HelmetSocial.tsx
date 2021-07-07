import * as React from "react";
import { Helmet } from "react-helmet-async";

interface IHelmetSocialProps {
  title: string;
  description?: string;
  googleImageUrl?: string;
  twitterImageUrl?: string;
  otherImageUrl?: string;
  otherImageWidth?: number;
  otherImageHeight?: number;
}

export const HelmetSocial: React.FunctionComponent<IHelmetSocialProps> = (props) => {
  const {
    title,
    description,
    children,
    googleImageUrl,
    twitterImageUrl,
    otherImageUrl,
    otherImageWidth,
    otherImageHeight,
  } = props;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}

      {/* Google Plus */}
      <meta itemProp="name" content={title} />
      {description && <meta itemProp="description" content={description} />}
      {googleImageUrl && <meta itemProp="image" content={googleImageUrl} />}

      {/* Twitter */}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {twitterImageUrl && <meta name="twitter:image:alt" content={title} />}
      {twitterImageUrl && <meta name="twitter:image" content={twitterImageUrl} />}

      {/* Others */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {otherImageUrl && <meta property="og:image" content={otherImageUrl} />}
      {otherImageUrl && <meta property="og:image:width" content={otherImageWidth.toString()} />}
      {otherImageUrl && <meta property="og:image:height" content={otherImageHeight.toString()} />}

      {children}
    </Helmet>
  );
};

HelmetSocial.defaultProps = {
  otherImageWidth: 1200,
  otherImageHeight: 630,
};

import React, { Component, ReactNode } from "react";
import { NextContext } from "next";
import Button from "react-bulma-components/lib/components/button";

interface Props {
  query: {
    username?: string;
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    scope?: string;
  };
}

export default class OAuth extends Component<Props> {
  public static async getInitialProps({ query }: NextContext): Promise<Props> {
    return { query };
  }

  public render(): ReactNode {
    /* eslint-disable @typescript-eslint/camelcase */

    const {
      username,
      client_id,
      redirect_uri,
      response_type,
      scope,
    } = this.props.query;

    return (
      <div>
        <Button color="primary">My Bulma button</Button>
        Hello World{" "}
        {JSON.stringify({
          username,
          client_id,
          redirect_uri,
          response_type,
          scope,
        })}
      </div>
    );

    /* eslint-enable @typescript-eslint/camelcase */
  }
}

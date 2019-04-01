import React, { Component, ReactNode } from "react";
import { NextContext } from "next";
import Button from "react-bulma-components/lib/components/button";
import RemoteStorage from "../RemoteStorage";

interface Props {
  path: string;
  folder: any;
}

export default class OAuth extends Component<Props> {
  public static async getInitialProps({ query }: NextContext): Promise<Props> {
    const { path } = query;

    const rs = new RemoteStorage(`https://foobar/storage`, "");
    const res = await rs.get(path);
    const folder = await res.json();

    return { path, folder };
  }

  public render(): ReactNode {
    /* eslint-disable @typescript-eslint/camelcase */

    const { path, folder } = this.props;

    return (
      <div>
        <Button color="primary">My Bulma button</Button>
        {path}
        {JSON.stringify(folder)}
      </div>
    );

    /* eslint-enable @typescript-eslint/camelcase */
  }
}

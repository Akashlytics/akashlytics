import { GeneratedType } from "@cosmjs/proto-signing";

import * as v1beta1 from "./v1beta1";
import * as v1beta2 from "./v1beta2";

export const akashTypes: ReadonlyArray<[string, GeneratedType]> = [...Object.values(v1beta1), ...Object.values(v1beta2)].map((x) => ["/" + x.$type, x]);

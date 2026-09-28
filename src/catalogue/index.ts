import { technologies as t0 } from "./technologies/frontend";
import { technologies as t1 } from "./technologies/mobile";
import { technologies as t2 } from "./technologies/desktop";
import { technologies as t3 } from "./technologies/backend";
import { technologies as t4 } from "./technologies/database";
import { technologies as t5 } from "./technologies/auth";
import { technologies as t6 } from "./technologies/ui";
import { technologies as t7 } from "./technologies/frontend-library";
import { technologies as t8 } from "./technologies/backend-library";
import { technologies as t9 } from "./technologies/ai";
import { technologies as t10 } from "./technologies/payments";
import { technologies as t11 } from "./technologies/analytics";
import { technologies as t12 } from "./technologies/monitoring";
import { technologies as t13 } from "./technologies/feature-flags";
import { technologies as t14 } from "./technologies/email";
import { technologies as t15 } from "./technologies/storage";
import { technologies as t16 } from "./technologies/search";
import { technologies as t17 } from "./technologies/infrastructure";
import { technologies as t18 } from "./technologies/deployment";
import { technologies as t19 } from "./technologies/runtime";
import { technologies as t20 } from "./technologies/automation";
export const catalogue = [
  ...t0,
  ...t1,
  ...t2,
  ...t3,
  ...t4,
  ...t5,
  ...t6,
  ...t7,
  ...t8,
  ...t9,
  ...t10,
  ...t11,
  ...t12,
  ...t13,
  ...t14,
  ...t15,
  ...t16,
  ...t17,
  ...t18,
  ...t19,
  ...t20,
];
export const byId = Object.fromEntries(catalogue.map((t) => [t.id, t]));

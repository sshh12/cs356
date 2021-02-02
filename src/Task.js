import { useState } from "react";
import { Box, Heading, Text, Card, Flex } from "rebass";
import { Label, Input, Select } from "@rebass/forms";
import Qty from "js-quantities";

let getUnits = (kind) => {
  if (typeof kind !== "string") {
    if (typeof kind == "object") {
      if (kind.length && kind.length > 0) {
        kind = kind[0].kind();
      } else if (typeof kind.length === "undefined") {
        kind = kind.kind();
      } else {
        kind = "unitless";
      }
    } else if (typeof kind == "number") {
      kind = "unitless";
    }
  }
  let units = Qty.getUnits(kind);
  if (kind === "time") {
    units.push("millisecond");
  }
  return units;
};

let tryUnitCvt = (val, units) => {
  try {
    if (val.length) {
      return val.map((v) => v.to(units).toString()).join(", ");
    }
    return val.to(units).toString();
  } catch (e) {
    console.log("!!!!", val);
    return "";
  }
};

export default function Task({ title, problem, vars, calcs, defaultUnits }) {
  let [state, setState] = useState(vars);
  let [units, setUnits] = useState(defaultUnits);
  let calcState = JSON.parse(JSON.stringify(state));
  for (let calcKey in calcs) {
    try {
      calcState[calcKey] = calcs[calcKey]({ ...calcState, calcs });
    } catch (err) {
      console.warn(err);
      calcState[calcKey] = "";
    }
  }

  return (
    <Card
      sx={{
        p: 1,
        borderRadius: 2,
      }}
      mb={10}
      ml={10}
      mr={10}
    >
      <Box textAlign="left" p={2}>
        <Heading as="h3">{title}</Heading>
        <Text>{problem}</Text>
        <Flex>
          {Object.keys(vars).map((varn, i) => (
            <Box key={i} ml={i === 0 ? 0 : 2} pt={2} width={[1, 1 / 6]}>
              <Label htmlFor={varn + title} width={1}>
                ${varn.toUpperCase()}
                {calcs[varn] && typeof calcState[varn] == "object" && (
                  <Select
                    ml={1}
                    width={"100px"}
                    p={0}
                    fontSize={1}
                    id={"sel" + varn + title}
                    name={"sel" + varn + title}
                    defaultValue={defaultUnits[varn]}
                    value={units[varn]}
                    onChange={(e) =>
                      setUnits({
                        ...units,
                        [varn]: e.target.value,
                      })
                    }
                  >
                    {getUnits(calcState[varn]).map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </Select>
                )}
              </Label>
              <Input
                key={varn}
                id={varn + title}
                name={varn + title}
                defaultValue={vars[varn] || null}
                value={
                  typeof calcState[varn] == "object"
                    ? tryUnitCvt(calcState[varn], units[varn])
                    : calcState[varn] || ""
                }
                onChange={(evt) =>
                  setState({ ...state, [varn]: evt.target.value })
                }
              />
            </Box>
          ))}
        </Flex>
      </Box>
    </Card>
  );
}

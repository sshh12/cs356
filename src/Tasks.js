import Task from "./Task";
import Qty from "js-quantities";
import binpmf from "@stdlib/stats/base/dists/binomial/pmf";

const TASKS = [
  <Task
    title={"Transfer Speed"}
    problem={
      "Transfering $SIZE of data over a $RATE connection will take $TIME."
    }
    vars={{ size: "10GB", rate: "10Mbps", time: null }}
    calcs={{ time: ({ size, rate }) => Qty(size).div(Qty(rate)) }}
    defaultUnits={{ time: "second" }}
  />,
  <Task
    title={"Max Users With Packet Switching"}
    problem={
      "Given a $RATE total link and $P % active users that use $USERRATE with $AVAIL % availability, there can be $MAX users ($PEAKUSERS)."
    }
    vars={{
      rate: "5Gb/s",
      p: "25",
      userrate: "200 Mb/s",
      avail: "98",
      max: null,
      peakusers: null,
    }}
    calcs={{
      max: ({ rate, p, userrate, avail }) => {
        p = parseFloat(p) / 100;
        avail = parseFloat(avail) / 100;
        let peakUsers = Qty(rate).div(Qty(userrate)).scalar;
        let n = peakUsers;
        let found = false;
        while (n < peakUsers * 100) {
          let probNoErr = 0;
          for (let k = 0; k <= peakUsers; k++) {
            probNoErr += binpmf(k, n, p);
          }
          if (probNoErr < avail) {
            found = true;
            break;
          }
          n++;
        }
        return found ? n - 1 : "";
      },
      peakusers: ({ rate, p, userrate, avail }) => {
        return Qty(rate).div(Qty(userrate)).scalar;
      },
    }}
    defaultUnits={{}}
  />,
];

export default TASKS;

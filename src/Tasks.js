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
    title={"Packet Switching, Queuing Delay"}
    problem={
      "A router that processes at $RATE with an average arrival of $AVGARRIVAL of $SIZE packets, will have a queuing delay of $QDELAY (which is $QSTATUS)."
    }
    vars={{
      rate: "16 Mbps",
      avgarrival: "1000 count/s",
      size: "2000 bytes",
      qdelay: null,
      qstatus: null,
    }}
    calcs={{
      qdelay: ({ rate, avgarrival, size }) => {
        rate = Qty(rate);
        avgarrival = Qty(avgarrival);
        size = Qty(size);
        return size.mul(avgarrival).div(rate).scalar;
      },
      qstatus: ({ rate, avgarrival, size }) => {
        rate = Qty(rate);
        avgarrival = Qty(avgarrival);
        size = Qty(size);
        let val = size.mul(avgarrival).div(rate).scalar;
        if (val < 0.7) {
          return "SMALL";
        } else if (val <= 1) {
          return "LARGE";
        }
        return "INFINITE";
      },
    }}
    defaultUnits={{}}
  />,
  <Task
    title={"Packet Switching, Max Users"}
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
      peakusers: ({ rate, userrate }) => {
        return Qty(rate).div(Qty(userrate)).scalar;
      },
    }}
    defaultUnits={{}}
  />,
  <Task
    title={"Packet Switching, Transmission Delay"}
    problem={
      "If a $SIZE payload is sent over $RATE $HOPS as $PACKETS equal-sized packets (with $HEADER header size), it will take $TIME."
    }
    vars={{
      size: "1MB",
      rate: "20 Mbps",
      hops: "3",
      packets: "1000",
      header: "100 bytes",
      time: null,
    }}
    calcs={{
      time: ({ size, rate, hops, packets, header }) => {
        size = Qty(size);
        rate = Qty(rate);
        hops = parseInt(hops);
        packets = parseInt(packets);
        header = Qty(header);
        let packetSize = size.div(packets).add(header);
        let perHopTime = packetSize.div(rate);
        let firstArrive = perHopTime.mul(hops);
        return firstArrive.add(perHopTime.mul(packets - 1));
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
];

export default TASKS;

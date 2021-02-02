import Task from "./Task";
import Qty from "js-quantities";
import binpmf from "@stdlib/stats/base/dists/binomial/pmf";

let isTruthy = (val) => {
  return ["y", "yes", "1", "enabled"].includes(val);
};

let parseIntList = (val) => {
  return val
    .split(",")
    .map((v) => parseInt(v))
    .filter((v) => !isNaN(v));
};

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
      qstatus: ({ rate, avgarrival, size, calcs }) => {
        let val = calcs.qdelay({ rate, avgarrival, size });
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
  <Task
    title={"HTTP/2, Server Delay"}
    problem={
      "If a $FRAMES with $PRIORITIES are sent over HTTP/2 with $FRAMERATE time per frame, the delays will be $DELAYS respectively ($AVGDELAY)"
    }
    vars={{
      frames: "2000,3,3,3,3,3",
      priorities: "1,1,1,1,1,1",
      framerate: "1ms",
      interleaved: "yes",
      delays: null,
      avgdelay: null,
    }}
    calcs={{
      delays: ({ frames, priorities, framerate, interleaved }) => {
        interleaved = isTruthy(interleaved);
        frames = parseIntList(frames);
        priorities = parseIntList(priorities);
        framerate = Qty(framerate);
        if (frames.length != priorities.length) return 0;
        let delays = [];
        if (!interleaved) {
          let curDelay = null;
          let orderedFrames = frames
            .map((f, i) => [i, f])
            .sort((a, b) => priorities[b[0]] - priorities[a[0]]);
          for (let [frameIdx, frameCnt] of orderedFrames) {
            if (curDelay !== null) {
              curDelay = framerate.mul(frameCnt).add(curDelay);
            } else {
              curDelay = framerate.mul(frameCnt);
            }
            delays[frameIdx] = curDelay;
          }
        } else {
          let curDelay = null;
          let remainingFrameCnts = frames
            .map((f, i) => [i, f, priorities[i]])
            .sort((a, b) => priorities[b[0]] - priorities[a[0]]);
          while (remainingFrameCnts.length > 0) {
            let highestPri = remainingFrameCnts[0][2];
            for (let [frameIdx, _, pri] of remainingFrameCnts) {
              let frameObj = remainingFrameCnts.find((rf) => rf[0] == frameIdx);
              if (pri != highestPri) continue;
              frameObj[1]--;
              if (frameObj[1] == 0) {
                remainingFrameCnts = remainingFrameCnts.filter(
                  (rf) => rf[0] != frameIdx
                );
              }
              if (curDelay !== null) {
                curDelay = framerate.mul(1).add(curDelay);
              } else {
                curDelay = framerate.mul(1);
              }
              delays[frameIdx] = curDelay;
            }
          }
        }
        return delays;
      },
      avgdelay: ({ frames, priorities, framerate, interleaved, calcs }) => {
        return calcs
          .delays({ frames, priorities, framerate, interleaved })
          .reduce((acc, cur) => acc.add(cur))
          .div(frames.split(",").length);
      },
    }}
    defaultUnits={{ delays: "second", avgdelay: "second" }}
  />,
];

export default TASKS;

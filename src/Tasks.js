import Task from "./Task";
import Qty from "js-quantities";
import binpmf from "@stdlib/stats/base/dists/binomial/pmf";

let isTruthy = (val) => {
  return ["y", "yes", "1", "enabled"].includes(val);
};

let qtyMax = (...qs) => {
  let mx = qs.reduce((acc, cur) => {
    return acc.div(cur).scalar >= 1 ? acc : cur;
  });
  return mx;
};

let parseIntList = (val) => {
  return val
    .split(",")
    .map((v) => parseInt(v))
    .filter((v) => !isNaN(v));
};

let parseQtyList = (val) => {
  return val.split(",").map((v) => Qty(v));
};

const TASKS = [
  <Task
    title={"Transmission Delay"}
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
      "If $FRAMES with $PRIORITIES are sent over HTTP/2 with $FRAMERATE time per frame, the delays will be $DELAYS respectively ($AVGDELAY)"
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
        if (frames.length !== priorities.length) return 0;
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
            for (let [frameIdx, , pri] of remainingFrameCnts) {
              let frameObj = remainingFrameCnts.find(
                (rf) => rf[0] === frameIdx
              );
              if (pri !== highestPri) continue;
              frameObj[1]--;
              if (frameObj[1] === 0) {
                remainingFrameCnts = remainingFrameCnts.filter(
                  (rf) => rf[0] !== frameIdx
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
  <Task
    title={"HTTP/1.1, Response Time"}
    problem={
      "If $PAYLOADS are sent from the server with an $RTT over $PARALLEL $RATE connections, the response times will be $TIMES respectively ($AVGTIME)."
    }
    vars={{
      payloads: "1kb,5kb,5kb,5kb,5kb,5kb,5kb,5kb,5kb",
      rtt: "500 ms",
      parallel: "1",
      persistent: "no",
      rate: "1 kb/ms",
      times: null,
      avgtime: null,
    }}
    calcs={{
      times: ({ payloads, rtt, parallel, rate, persistent }) => {
        payloads = parseQtyList(payloads);
        rtt = Qty(rtt);
        parallel = parseInt(parallel);
        persistent = isTruthy(persistent);
        rate = Qty(rate);
        let times = [];
        if (!persistent) {
          if (parallel !== 1) return "TODO";
          let curTime = null;
          let i = 0;
          for (let p of payloads) {
            let pTime = p.div(rate).add(rtt.mul(2));
            if (curTime == null) {
              curTime = pTime;
            } else {
              curTime = curTime.add(pTime);
            }
            times[i++] = curTime;
          }
        } else {
          if (parallel !== payloads.length) return "TODO";
          return "TODO";
        }
        return times;
      },
      avgtime: ({ payloads, rtt, parallel, rate, persistent, calcs }) => {
        return calcs
          .times({ payloads, rtt, parallel, rate, persistent })
          .reduce((acc, cur) => acc.add(cur))
          .div(payloads.split(",").length);
      },
    }}
    defaultUnits={{ times: "second", avgtime: "second" }}
  />,
  <Task
    title={"File Distribution, Client-Server"}
    problem={
      "To send a $SIZE file from an $SRATE server to $N clients that can download at (minimum) $RATE, it will take at least $TIME."
    }
    vars={{
      size: "100 Mbit",
      srate: "200 Mbps",
      n: "10",
      rate: "10 Mbps",
      time: null,
    }}
    calcs={{
      time: ({ size, srate, n, rate }) => {
        size = Qty(size);
        srate = Qty(srate);
        n = parseInt(n);
        rate = Qty(rate);
        let serverTime = size.div(srate).mul(n);
        let clientTime = size.div(rate);
        return qtyMax(serverTime, clientTime);
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
  <Task
    title={"File Distribution, P2P"}
    problem={
      "To send a $SIZE file from an $SRATE server to $N clients that can download at (minimum) $DRATE and upload at $URATE, it will take at least $TIME."
    }
    vars={{
      size: "100 Mbit",
      srate: "200 Mbps",
      n: "10",
      drate: "10 Mbps",
      urate: "1 Mbps",
      time: null,
    }}
    calcs={{
      time: ({ size, srate, n, drate, urate }) => {
        size = Qty(size);
        srate = Qty(srate);
        n = parseInt(n);
        drate = Qty(drate);
        urate = Qty(urate);
        let serverOneTime = size.div(srate);
        let clientDownloadTime = size.div(drate);
        let clientUploadTime = size.div(urate.mul(n).add(srate)).mul(n);
        return qtyMax(serverOneTime, clientDownloadTime, clientUploadTime);
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
  <Task
    title={"Bloom Filter"}
    problem={
      "Given a Bloom filter with $N bits, $M elements in set S, and $K hash functions, $P is the prob. a bit is still zero after all insertions and $F is the prob. of FPs ($KBEST is optimal # of hash functions)."
    }
    vars={{
      n: "16",
      m: "4",
      k: "2",
      p: null,
      f: null,
      kbest: null,
    }}
    calcs={{
      p: ({ n, m, k }) => {
        n = parseInt(n);
        m = parseInt(m);
        k = parseInt(k);
        return Math.pow(1 - 1 / n, k * m);
      },
      f: ({ n, m, k, calcs }) => {
        let p = calcs.p({ n, m, k });
        return Math.pow(1 - p, k);
      },
      kbest: ({ n, m, calcs }) => {
        let kfs = {};
        for (let i = 1; i <= parseInt(n); i++) {
          kfs[i] = calcs.f({ n, m, k: i, calcs: calcs });
        }
        console.log(kfs);
        let best = Math.min(...Object.values(kfs));
        console.log(best);
        let bestK = Object.keys(kfs).find((k) => kfs[k] === best);
        console.log(bestK);
        return bestK;
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
  <Task
    title={"Checksum"}
    problem={"A checksum of $A and $B will be $CHECKSUM (their sum is $SUM)."}
    vars={{
      a: "1110011001100110",
      b: "1101010101010101",
      sum: null,
      checksum: null,
    }}
    calcs={{
      sum: ({ a, b }) => {
        a = a.replace(/[^10]/g, "");
        b = b.replace(/[^10]/g, "");
        let sum = parseInt(a, 2) + parseInt(b, 2);
        let sumBin = (sum >>> 0).toString(2);
        if (sumBin.length > a.length) {
          sumBin = ((sum + 1) >>> 0).toString(2).substring(1);
        }
        return sumBin;
      },
      checksum: ({ a, b, calcs }) => {
        return [...calcs.sum({ a, b })]
          .map((c) => (c === "1" ? "0" : "1"))
          .join("");
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
  <Task
    title={"RTD 3.0, Link Utilization"}
    problem={
      "Sending $SIZE packets over a $RATE/$RTT connection ($PARALLEL at the same time) will result in $LINKUTIL."
    }
    vars={{
      size: "5000 bytes",
      rate: "1 Mbps",
      rtt: "400 ms",
      parallel: "1",
      linkutil: null,
    }}
    calcs={{
      linkutil: ({ size, rate, rtt, parallel }) => {
        size = Qty(size);
        rate = Qty(rate);
        rtt = Qty(rtt);
        parallel = parseInt(parallel);
        let result = size.div(rate).mul(parallel).div(size.div(rate).add(rtt));
        return Math.floor(result.scalar * 10000) / 100 + "%";
      },
    }}
    defaultUnits={{ time: "second" }}
  />,
];

export default TASKS;

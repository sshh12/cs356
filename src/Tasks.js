import Task from "./Task";
import Qty from "js-quantities";

export default [
  <Task
    title={"Transfer Speed"}
    problem={
      "Transfering $SIZE of data over a $RATE connection will take $TIME."
    }
    vars={{ size: "10GB", rate: "10Mbps", time: null }}
    calcs={{ time: ({ size, rate }) => Qty(size).div(Qty(rate)) }}
    defaultUnits={{ time: "second" }}
  />,
];

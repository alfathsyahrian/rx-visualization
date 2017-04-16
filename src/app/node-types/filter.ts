import {RxNode} from "./rxNode";
export class Filter extends RxNode {
  protected static title = "Filter";
  protected static link = "http://reactivex.io/documentation/operators/filter.html";
  protected static desc = "transform the items emitted by an Observable by applying a function to each item";
  protected static maxInput = 1;
  protected static minInput = 1;

  protected static propertiesType = [{
    name: "fi", type: 'function', types: [
      {
        name: "even", func: (x, idx, obs) => {
        return x % 2 === 0;
      }, text: "(x, idx, obs)=>{return x % 2 === 0;}"
      },
      {
        name: "odd", func: (x, idx, obs) => {
        return x % 2 === 1;
      }, text: "(x, idx, obs)=>{return x % 2 === 1;}"
      },
    ]
  }];

  public runner = () => {
    return this.graphInputs[0].filter(Filter.propertiesType[0].types[this.properties.fi].func);
  };
  public toString = () => {
    return '.filter(' + Filter.propertiesType[0].types[this.properties.fi].text + ')';
  };


  public properties = {
    fi: 0,
  };
  public graphInputs = [];
}
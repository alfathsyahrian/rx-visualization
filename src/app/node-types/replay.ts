import {RxNode} from "./rxNode";
export class Replay extends RxNode {
  protected static title = "Replay";
  protected static link = "http://reactivex.io/documentation/operators/replay.html";
  protected static desc = "ensure that all observers see the same sequence of emitted items, even if they subscribe after the Observable has begun emitting items";
  protected static maxInput = 1;
  protected static minInput = 1;

  protected static propertiesType = [
    {
    name:"transFunc",type: 'function',
      types: [
        {
          name: "num", func: (x) => {
          return x.take(2).repeat(2);
        }, text: '(x)=>{return x.take(2).repeat(2);}'
        },
        {name: "text", func: "text", text: "'text'"},
      ],
      desc: "a transforming function that takes an item emitted by the source Observable as its parameter and returns an item to be emitted by the resulting Observable"
    },
    {
      name:"bufferSize",type: 'number',
      types: null,
      desc: 'the maximum number of items to buffer and replay to subsequent observers'
    },
    {name:"window",type: 'number', types: null, desc: 'the maximum number of items to buffer and replay to subsequent observers'},
    {name:"scheduler",type: 'number', types: null, desc: 'the Scheduler on which this operator will operate'},
  ];

  public runner = () => {
    return this.graphInputs[0].replay(Replay.propertiesType[0].types[this.properties.transFunc].func, this.properties.bufferSize, this.properties.window, this.properties.scheduler);
  };
  public toString = () => {
    return '.replay(' + Replay.propertiesType[0].types[this.properties.transFunc].text + ', ' + this.properties.bufferSize + ', ' + this.properties.window + ', ' + this.properties.scheduler + ')';
  };


  public properties = {
    transFunc: 0,
    bufferSize: 2,
    window: null,
    scheduler: null
  };
  public graphInputs = [];
}
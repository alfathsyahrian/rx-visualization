import {Observable} from "rxjs/Rx";
import {RxNode} from "./rxNode";

export class Take extends RxNode {
  protected static title = "Take";
  protected static link = "http://reactivex.io/documentation/operators/take.html";
  protected static desc = "emit only the first n items emitted by an Observable";
  protected static maxInput = 1;
  protected static minInput = 1;

  protected static propertiesType = [{name:"itemCount",type: "number"}];

  public runner = ({}) => {
    return this.graphInputs[0].take(this.properties.itemCount);
  };
  public toString = ({}) => {
    return '.take(' + this.properties.itemCount + '))';
  };


  public properties = {
    itemCount: 2
  };
  public graphInputs = [];
}
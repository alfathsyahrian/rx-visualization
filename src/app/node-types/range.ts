import {range} from 'rxjs';
import {RxNode} from './rxNode';
import {PropertyType} from './property-type';
import {PropertyTypeEnum} from './propertyType.enum';

export class Range extends RxNode {
  protected static title = 'Range';
  protected static desc = 'create an Observable that emits a particular range of sequential integers';
  protected static maxInput = 0;
  protected static minInput = 0;

  protected static propertiesType = new PropertyType('object', PropertyTypeEnum.Object, [
    new PropertyType('start', PropertyTypeEnum.Number),
    new PropertyType('count', PropertyTypeEnum.Number)
  ], '');

  public properties = {
    start: 0,
    count: 3
  };
  public graphInputs = [];

  public runner = () => {
    return range(this.properties.start, this.properties.count);
  }
  public toString = () => {
    return `range(${this.properties.start}, ${this.properties.count})`;
  }
}

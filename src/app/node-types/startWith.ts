import {RxNode} from './rxNode';
import {PropertyTypeEnum} from './propertyType.enum';
import {PropertyType} from './property-type';
import {startWith} from 'rxjs/operators';

export class StartWith extends RxNode {
  protected static title = 'StartWith';
  protected static desc = 'emit a specified sequence of items before beginning to emit the items from the source Observable';
  protected static maxInput = 1;
  protected static minInput = 1;

  protected static propertiesType = new PropertyType('startWith', PropertyTypeEnum.String);

  public properties = {
    startWith: '2',
  };
  public graphInputs = [];

  public runner = () => {
    return this.graphInputs[0].observable.pipe(startWith(this.properties.startWith));
  }
  public toString = () => {
    return `.pipe(startWith(${this.properties.startWith}))`;
  }
}

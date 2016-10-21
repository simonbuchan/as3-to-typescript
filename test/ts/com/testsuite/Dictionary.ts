import { Dictionary } from "../flash/utils/Dictionary";

	export class DictionaryTest
	{
		private dict:Map<any, any> = new Map<any, any>();

		public methodName(variable: any): void
		{
			delete this.dict[ variable[0] ];
			delete this.dict[ variable[ this.otherCall() ][ this.anotherCall() ] ];
			this.dict[ variable[0] ] = 4;
			this.dict[ variable[ this.otherCall() ][ this.anotherCall() ] ] = this.something[ 6 ];
		}

	}


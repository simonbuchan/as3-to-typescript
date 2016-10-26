import { BasicVersions } from "./BasicVersions";
import { StringUtil } from "./StringUtil";

	

	export class DictionaryUtil
	{

		public static clone( original:Map<any, any> ):Map<any, any>
		{
			BasicVersions.itemXMLVersion = StringUtil.trim( this.version.substr( this.version.indexOf( "=" ) + 1 ) );

			var cloned:Map<any, any> = new Map<any, any>();
			for (let key of Array.from(original.keys()))
			{
				cloned.set(key, original.get(key));
			}
			return cloned;
		}

		/**
		 * Concatenates any number of dictionaries
		 *
		 * @param dictionaries comma separated list of dictionaries
		 * @return concatenated dictionary
		 *
		 */
		public static concatDictionaries( ...dictionaries ):Map<any, any>
		{
			var concatenatedDictionary:Map<any, any> = (<Map<any, any>>dictionaries[0] );
			var dictionary:Map<any, any>;
			for (var i:number = 1; i < dictionaries.length; i++)
			{
				dictionary = dictionaries[i];
				for (let key of Array.from(dictionary.keys()))
				{
					concatenatedDictionary.set(key, dictionary.get(key));
				}
			}
			return concatenatedDictionary;
		}

	}


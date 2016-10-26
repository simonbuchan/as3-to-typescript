package com.goodgamestudios.utils
{

	import flash.utils.Dictionary;

	public class DictionaryUtil
	{

		public static function clone( original:Dictionary ):Dictionary
		{
			BasicVersions.itemXMLVersion = StringUtil.trim( version.substr( version.indexOf( "=" ) + 1 ) );

			var cloned:Dictionary = new Dictionary();
			for (var key:Object in original)
			{
				cloned[key] = original[key];
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
		public static function concatDictionaries( ...dictionaries ):Dictionary
		{
			var concatenatedDictionary:Dictionary = dictionaries[0] as Dictionary;
			var dictionary:Dictionary;
			for (var i:int = 1; i < dictionaries.length; i++)
			{
				dictionary = dictionaries[i];
				for (var key:Object in dictionary)
				{
					concatenatedDictionary[key] = dictionary[key];
				}
			}
			return concatenatedDictionary;
		}

	}
}

package com.testsuite
{

	import com.testsuite.packagename.IBaseInterface;

	public interface Interface extends IBaseInterface
	{
		function get globals():IBaseInterface;
		function set globals( globals:IBaseInterface ):void;

		function get vector():Vector.<String>;
		function set vector( value:Vector.<String> ):void;

		function get baseURL():String;

	}
}

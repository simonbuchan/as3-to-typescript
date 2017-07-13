/**
 * Created by Ushan on 30.06.2017.
 */
package
{
import flash.display.MovieClip;

public class DynamicTypesObjectNMovies
{
	public function DynamicTypesObjectNMovies()
	{
		var myObject:Object = {}
		myObject.a = 10;
		trace(myObject.a);

		var myMovie:MovieClip = new MovieClip();
		myMovie.a = 10;
		trace(myMovie.a);
	}
}
}

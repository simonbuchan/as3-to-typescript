package
{
public class ForEachSimple
{
    public function ForEachSimple()
    {
        var myObj:Object = {a:2, b:3, c:40};
        for each (value in myObj)
        {
            trace(value);
        }
    }

}
}
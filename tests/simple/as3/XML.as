package {
public class XML {

  public function XML() {

    var sport:XML =
      <sport>
        <name isCool='yes'>Basketball</name>
        <players>men</players>
        <players>women</players>
        <nationalTV>NBC</nationalTV>
        <nationalTV>ESPN</nationalTV>
      </sport>;

    sport.name.@isCool = '→';

    trace('sport name isCool: ' + sport.name.attributes['isCool']);
    trace('sport name isCool: ' + sport.name.@isCool);
  }
}
}

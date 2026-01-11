-------logic-----
const countState = useState(0);
const count = countState[0];    // 当前值
const setCount = countState[1]; // 更新函数

---usecase---
function App() {
  const [open, setOpen] = useState(false);

  function toggleModal() {
    setOpen(!open);
  }

  return (
    <>
      <button onClick={toggleModal}>
        {open ? "Close" : "Open"} Modal
      </button>

      {open && <div className="modal">I am a modal</div>}
    </>
  );
}


--> Deconstruct 
let {a, b} = object

--> Combination ( ... )
let arr1 = [ ]
let arr2 = [ ]
let arr3 = [...arr1, ...arr2]

--> temaplate string 
** use ` `
**example:
const message = `Hello, ${name}!
You are ${age} years old.`;


for <pre id = "gg">
document.getElementById("gg").innerHTML = message;

for <div id = "gg">
document.getElementById("gg").innerHTML = message;

----------------------------------------------------------------------------------------

JSX: 
Allow to write HTML in js
we can execute js in {}  (function/variable)

const = <h1> I love JSX </h1>；
const = <h1> I am {5 + 5} years old </h1>；          //must be wrapped under a top element
createRoot(document.getElementById("root")).render(
  const
)


//if more than 1 top element use <> </> and ()
const = (<>
   <h1> </h1>
   <h1> </h1>
   </>)


--> Style attribute use camel case
formal : font-size = 15px
JSX : fontSize = 15px

----------------------------------------------------------------------------------

React Component
similiar with function but return HTML code.
First name must be uppertext!!!!!!!
must have return value
- Class Component
- Function Component

Function Component:
function Car(props){
 return(<>
  <h1> I am a {props.brand} car</h1>
  </>) 
}

function Garage(){
  return(<>
  <h1> I have a </h1>
  <Car brand = "Ford">
  </>)
}

createRoot(document.getElementById("root")).render(<Garage/>)    //componnet need (<>)
  
Class Component:
class Car extends React.Component{
  constructor(){
    super();                           
    this.state = 
  }
  render(){
    return <h1>hihi</h1>;
  }
}

class Car1 extend React.Component{
  render(){
    return(<h1></h1>);
  }
}

**super() call the React.Component 's constructor function


-->state
Initielized the object properties

class Car extends React.Components{
  constructor(props){
    super(props);
    this.state = {
      brand = "Ford"，
      model = "TRX"
    };
  }
  render(){
    return(
      <div>
      <h1> This is my {this.state.brand}</h1>
      </div>
    );
  }
}
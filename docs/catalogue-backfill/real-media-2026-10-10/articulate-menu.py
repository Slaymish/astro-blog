"""Run only the original prompt menu; never import microphone/API clients."""
import builtins,runpy,sys,types
sys.modules['util']=types.ModuleType('util')
class MenuComplete(Exception): pass
def stop_at_input(prompt):
    print(prompt,end='')
    raise MenuComplete()
builtins.input=stop_at_input
try: runpy.run_path(sys.argv[1],run_name='__main__')
except MenuComplete: pass

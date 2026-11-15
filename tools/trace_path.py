# Re-trace the intro spark path if you replace public/intro/strava_path.png.
# Needs: pip install numpy opencv-python scikit-image networkx
# Usage: python tools/trace_path.py START_X START_Y END_X END_Y   (pixel coordinates of the start and finish circles in your image)
import sys,json,numpy as np,cv2,networkx as nx
from skimage.morphology import skeletonize
sx,sy,ex,ey=map(float,sys.argv[1:5])
im=cv2.imread("public/intro/strava_path.png",cv2.IMREAD_UNCHANGED);H,W=im.shape[:2]
sk=skeletonize(im[:,:,3]>128);ys,xs=np.nonzero(sk);S=set(zip(xs.tolist(),ys.tolist()));G=nx.Graph()
for x,y in S:
    for dx,dy in((1,0),(0,1),(1,1),(1,-1)):
        if (x+dx,y+dy) in S:G.add_edge((x,y),(x+dx,y+dy),weight=(dx*dx+dy*dy)**.5)
near=lambda cx,cy:min(S,key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2)
p=nx.shortest_path(G,near(sx,sy),near(ex,ey),weight="weight")
pts=cv2.approxPolyDP(np.array(p,dtype=np.float32).reshape(-1,1,2),1.6,False).reshape(-1,2).astype(int).tolist()
open("src/introPath.js","w").write("export const PATH={W:%d,H:%d,pts:%s};\n"%(W,H,json.dumps(pts,separators=(',',':'))))
print(len(pts),"points written to src/introPath.js")

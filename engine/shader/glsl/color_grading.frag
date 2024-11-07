#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color       = subpassLoad(in_color).rgba;
    
    // texture(color_grading_lut_texture_sampler, uv)

    highp float red_subscript            = (_COLORS-1.0)*color.r;
    highp float green_subscript        = (_COLORS-1.0)*color.g;
    highp float blue_subscript           = (_COLORS-1.0)*color.b;

    highp float x_size=float(lut_tex_size.x);//求LUT图的横轴长度，一个像素点一个像素点地数

    //因为决定在哪个格子上取色采样的是B值，所以我们要用基础色的B值决定横轴坐标u
    highp float x1=red_subscript+ceil(blue_subscript)*_COLORS;//ceil(x)是求不大于x的最大整数
    highp float u1=x1/x_size;//因为读取LUT图用的坐标是uv坐标系，u和v的取值范围都是[0,1],所以这里除以LUT图的横向像素点数就转化为了uv坐标系
    highp float x2=red_subscript+floor(blue_subscript)*_COLORS;//floor(x)是求大于x的最小整数
    highp float u2=x2/x_size;

    //现在我们要根据u值求出v值，v值是由绿色也就是G值确定的
    highp float y=green_subscript;
    highp float v=y/_COLORS;//xy坐标系转化为uv坐标系

    //采样，在LUT图上采取一大一小两个样本
    highp vec2 p1=vec2(u1,v);
    highp vec2 p2=vec2(u2,v);
    highp vec3 color1=texture(color_grading_lut_texture_sampler,p1).xyz;
    highp vec3 color2=texture(color_grading_lut_texture_sampler,p2).xyz;
    
    //混合，其中frack是取小数部分的意思，按混合比例就是从前一个格子过度到后一个格子之间取舍，这里看颜色RGB的三维坐标系色彩空间图的话理解起来比较直观
    highp vec3 mixed_color=mix(color2,color1,fract(blue_subscript));
    out_color = vec4(mixed_color,color.a);
}

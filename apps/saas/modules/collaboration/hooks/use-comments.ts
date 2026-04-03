"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CommentAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface ProcessCommentType {
  id: string;
  processId: string;
  authorId: string;
  section: string;
  body: string;
  nodeId: string | null;
  procedureStepId: string | null;
  parentId: string | null;
  mentions: string[];
  resolved: boolean;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies?: ProcessCommentType[];
}

export function useComments(
  processId: string | undefined,
  section?: string,
) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    ...orpc.collaboration.listComments.queryOptions({
      input: {
        processId: processId ?? "",
        section,
      },
    }),
    enabled: !!processId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: {
      body: string;
      section: string;
      nodeId?: string;
      procedureStepId?: string;
      parentId?: string;
      mentions?: string[];
    }) =>
      orpcClient.collaboration.addComment({
        processId: processId ?? "",
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.collaboration.listComments.queryOptions({
          input: { processId: processId ?? "", section },
        }).queryKey,
      });
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      orpcClient.collaboration.resolveComment({
        commentId,
        processId: processId ?? "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.collaboration.listComments.queryOptions({
          input: { processId: processId ?? "", section },
        }).queryKey,
      });
    },
  });

  return {
    comments: (commentsQuery.data?.comments ?? []) as ProcessCommentType[],
    isLoading: commentsQuery.isLoading,
    addComment: addCommentMutation.mutate,
    isAdding: addCommentMutation.isPending,
    resolveComment: resolveCommentMutation.mutate,
    isResolving: resolveCommentMutation.isPending,
  };
}
